const API_URL = 'https://api.et3am.com';

async function apiCall(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTest() {
  console.log('=== Full Donation Flow Test ===\n');

  const timestamp = Date.now();
  const emailA = `donor_${timestamp}@example.com`;
  const emailB = `receiver_${timestamp}@example.com`;
  const password = 'Test123456!';

  // Step 1: User A registers as donor
  console.log('1. User A (Donor) registering...');
  const registerA = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: emailA, password, name: 'Donor User', role: 'donor' })
  });
  
  console.log('   Register response:', registerA.status, registerA.data);
  
  if (registerA.status === 201) {
    console.log('   ✓ User A registered:', registerA.data.userId);
  } else if (registerA.data.messageKey === 'auth.email_exists') {
    console.log('   → User A already exists, logging in...');
  } else {
    console.log('   Register error, trying login anyway...');
  }

  // Login User A
  const loginA = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailA, password })
  });
  console.log('   Login A response:', loginA.status, loginA.data);
  
  if (loginA.status !== 200) {
    console.log('   ✗ Login failed:', loginA.data);
    return;
  }
  
  const tokenA = loginA.data.token;
  const userAId = loginA.data.user?.id || loginA.data.userId;
  console.log('   ✓ User A logged in, ID:', userAId);
  
  // Step 2: User B registers as receiver
  console.log('2. User B (Receiver) registering...');
  const registerB = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: emailB, password, name: 'Receiver User', role: 'recipient' })
  });

  if (registerB.status === 201) {
    console.log('   ✓ User B registered:', registerB.data.userId);
  } else if (registerB.data.messageKey === 'auth.email_exists') {
    console.log('   → User B already exists, logging in...');
  }

  // Login User B
  const loginB = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailB, password })
  });
  const tokenB = loginB.data.token;
  const userBId = loginB.data.user?.id || loginB.data.userId;
  console.log('   ✓ User B logged in\n');

  // Step 3: User A creates a donation
  console.log('3. User A creating donation...');
  const createDonation = await apiCall('/api/donations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Test Meal Donation',
      food_type: 'cooked',
      quantity: 5,
      unit: 'portions',
      description: 'Test cooked meal donation',
      pickup_address: '123 Test Street, Cairo',
      pickup_date: new Date(Date.now() + 3600000).toISOString(),
      expiry_date: new Date(Date.now() + 86400000).toISOString()
    })
  });
  
  if (createDonation.status === 201) {
    console.log('   ✓ Donation created:', createDonation.data.donation.id);
  } else {
    console.log('   ✗ Failed:', createDonation.data);
    return;
  }

  // Step 4: User B views available donations
  console.log('\n4. User B viewing available donations...');
  const getDonations = await apiCall('/api/donations', {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const availableDonations = getDonations.data.donations || [];
  console.log('   Total donations:', availableDonations.length);
  
  // Find User A's donation
  const testDonation = availableDonations.find(d => d.donor_id === userAId && d.status === 'available');
  if (!testDonation) {
    console.log('   Available donations:', availableDonations.slice(0,3).map(d => ({ id: d.id?.slice(0,8), donor: d.donor_id?.slice(0,8), status: d.status })));
  }
  const donationId = testDonation?.id;

  // Step 5: User B reserves the donation
  console.log('\n5. User B reserving donation...');
  console.log('   reservation params:', { donationId, userBId });
  const reserve = await apiCall(`/api/donations/${donationId}/reserve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  
  console.log('   Reserve response:', reserve.status, reserve.data);
  
  if (reserve.status === 200) {
    console.log('   ✓ Donation reserved:', reserve.data.messageKey);
  } else {
    console.log('   ✗ Failed:', reserve.data);
    return;
  }

  // Step 6: Verify donation status is now reserved
  console.log('\n6. Verifying donation status...');
  const getDonation = await apiCall(`/api/donations/${donationId}`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  console.log('   Status:', getDonation.data.donation.status);
  console.log('   Reserved by:', getDonation.data.donation.reserved_by);
  console.log('   Donor ID:', getDonation.data.donation.donor_id);
  console.log('   User B ID:', userBId);

  // Step 7: User A marks donation as received/completed (DONOR marks completion after handoff)
  console.log('\n7. User A marking donation as completed...');
  console.log('   complete params:', { donationId, userAId });
  const complete = await apiCall(`/api/donations/${donationId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.log('   Complete response:', complete.status, complete.data);
  
  if (complete.status === 200) {
    console.log('   ✓ Donation completed:', complete.data.messageKey);
  } else {
    console.log('   ✗ Failed:', complete.data);
  }

  // Step 8: User A reviews User B (donor -> receiver)
  console.log('\n8. User A reviewing User B...');
  const reviewA = await apiCall('/api/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      reviewed_id: userBId,
      donation_id: donationId,
      rating: 5,
      comment: 'Great receiver, picked up on time!',
      review_type: 'donor_to_receiver'
    })
  });
  
  if (reviewA.status === 201) {
    console.log('   ✓ Review created:', reviewA.data.messageKey);
  } else {
    console.log('   ✗ Failed:', reviewA.data);
  }

  // Step 9: User B reviews User A (receiver -> donor)
  console.log('\n9. User B reviewing User A...');
  const reviewB = await apiCall('/api/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      reviewed_id: userAId,
      donation_id: donationId,
      rating: 5,
      comment: 'Excellent food, thank you!',
      review_type: 'receiver_to_donor'
    })
  });
  
  if (reviewB.status === 201) {
    console.log('   ✓ Review created:', reviewB.data.messageKey);
  } else {
    console.log('   ✗ Failed:', reviewB.data);
  }

  // Step 10: Verify reviews are visible
  console.log('\n10. Verifying reviews...');
  const reviewsA = await apiCall(`/api/reviews/user/${userAId}`);
  console.log(`    User A reviews: ${reviewsA.data.reviews?.length || 0}`);
  if (reviewsA.data.reviews?.length) {
    reviewsA.data.reviews.forEach(r => {
      console.log(`      - ${r.review_type}: ${r.rating} stars by ${r.reviewer_name}`);
    });
  }

  const reviewsB = await apiCall(`/api/reviews/user/${userBId}`);
  console.log(`    User B reviews: ${reviewsB.data.reviews?.length || 0}`);
  if (reviewsB.data.reviews?.length) {
    reviewsB.data.reviews.forEach(r => {
      console.log(`      - ${r.review_type}: ${r.rating} stars by ${r.reviewer_name}`);
    });
  }

  // Get user ratings
  console.log('\n11. User ratings...');
  console.log(`    User A rating: ${reviewsA.data.ratingStats?.avgRating || 'N/A'} (${reviewsA.data.ratingStats?.totalReviews || 0} reviews)`);
  console.log(`    User B rating: ${reviewsB.data.ratingStats?.avgRating || 'N/A'} (${reviewsB.data.ratingStats?.totalReviews || 0} reviews)`);

  console.log('\n=== Test Complete ===');
}

runTest().catch(console.error);
