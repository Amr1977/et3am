Feature: Donation Management
  As a donor on the Et3am platform
  I want to create and manage food donations
  So that I can help feed people in need

  Background:
    Given the API server is running

  Scenario: Donor creates a new donation
    Given I am authenticated as a donor
    And I have permission to donate
    When I send a POST request to "/api/donations" with valid donation data
    Then I should receive a 201 status code
    And the response should contain messageKey "donation.created"
    And the donation should be saved in the database

  Scenario: Donor creates donation without required fields
    Given I am authenticated as a donor
    When I send a POST request to "/api/donations" with missing required fields
    Then I should receive a 400 status code
    And the response should contain messageKey "validation.required_field"

  Scenario: User cannot donate without permission
    Given I am authenticated but cannot donate
    When I send a POST request to "/api/donations" with valid donation data
    Then I should receive a 403 status code
    And the response should contain messageKey "auth.cannot_donate"

  Scenario: Anonymous user views available donations
    When I send a GET request to "/api/donations"
    Then I should receive a 200 status code
    And the response should contain only available donations

  Scenario: Authenticated user filters donations by status
    Given I am authenticated as a regular user
    When I send a GET request to "/api/donations?status=available"
    Then I should receive a 200 status code
    And all returned donations should have status "available"

  Scenario: User reserves a donation
    Given an available donation exists
    And I am authenticated as a receiver
    And I have permission to receive
    And I have not reached daily limit
    When I send a POST request to "/api/donations/{donationId}/reserve"
    Then I should receive a 200 status code
    And the response should contain messageKey "donation.reserved"
    And the response should contain a hash_code

  Scenario: User cannot reserve their own donation
    Given I am authenticated as a donor
    And I have created a donation
    When I send a POST request to "/api/donations/{myDonationId}/reserve"
    Then I should receive a 400 status code
    And the response should contain messageKey "donation.cannot_reserve_own"

  Scenario: User cannot reserve unavailable donation
    Given a reserved donation exists
    And I am authenticated as a receiver
    When I send a POST request to "/api/donations/{reservedDonationId}/reserve"
    Then I should receive a 400 status code
    And the response should contain messageKey "donation.not_available"

  Scenario: User reaches daily reservation limit
    Given I am authenticated as a receiver
    And I have already reserved a donation today
    When I send a POST request to "/api/donations/{anotherDonationId}/reserve"
    Then I should receive a 429 status code
    And the response should contain messageKey "donation.daily_limit_reached"

  Scenario: Donor verifies receiver's hash code
    Given I am the donor of a reserved donation
    And the donation has a hash code
    When I send a POST request to "/api/donations/{donationId}/verify-hash" with correct code
    Then I should receive a 200 status code
    And the response should contain valid true

  Scenario: Donor completes donation delivery
    Given I am the donor of a reserved donation
    And the donation has a verified hash code
    When I send a POST request to "/api/donations/{donationId}/complete"
    Then I should receive a 200 status code
    And the response should contain messageKey "donation.completed"
    And the donation status should be "completed"

  Scenario: User cancels their reservation
    Given I have reserved a donation
    When I send a POST request to "/api/donations/{donationId}/cancel-reservation"
    Then I should receive a 200 status code
    And the response should contain messageKey "donation.reservation_cancelled"
    And the donation status should be "available"

  Scenario: User views their donations
    Given I am authenticated as a donor
    And I have created donations
    When I send a GET request to "/api/donations/my-donations"
    Then I should receive a 200 status code
    And the response should contain my donations

  Scenario: User views their reservations
    Given I am authenticated as a receiver
    And I have reserved donations
    When I send a GET request to "/api/donations/my-reservations"
    Then I should receive a 200 status code
    And the response should contain my reservations

  Scenario: Donor updates their donation
    Given I am authenticated as a donor
    And I have created a donation
    When I send a PUT request to "/api/donations/{donationId}" with updated data
    Then I should receive a 200 status code
    And the response should contain messageKey "donation.updated"

  Scenario: Donor deletes their donation
    Given I am authenticated as a donor
    And I have created a donation
    When I send a DELETE request to "/api/donations/{donationId}"
    Then I should receive a 200 status code
    And the response should contain messageKey "donation.deleted"
    And the donation should be removed from database