Feature: Admin Dashboard
  As an administrator of the Et3am platform
  I want to view statistics and manage content
  So that I can monitor and control the platform

  Background:
    Given the API server is running

  Scenario: Admin views dashboard statistics
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/stats"
    Then I should receive a 200 status code
    And the response should contain user statistics
    And the response should contain donation statistics

  Scenario: Admin views donation counts by status
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/stats"
    Then the response should contain donation counts by status

  Scenario: Admin views new users in last 30 days
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/stats"
    Then the response should contain newLast30Days users count

  Scenario: Admin views chart data
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/stats"
    Then the response should contain dailyDonations chart data
    And the response should contain statusDistribution

  Scenario: Admin views top areas
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/stats"
    Then the response should contain topAreas

  Scenario: Admin lists all users
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/users"
    Then I should receive a 200 status code
    And the response should contain users list

  Scenario: Admin searches users
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/users?search=john"
    Then the response should contain matching users

  Scenario: Admin updates a user
    Given I am authenticated as an admin
    And a user exists
    When I send a PUT request to "/api/admin/users/{userId}" with update data
    Then I should receive a 200 status code
    And the response should contain messageKey "user.updated"

  Scenario: Admin lists all donations
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/donations"
    Then I should receive a 200 status code
    And the response should contain donations list

  Scenario: Admin filters donations by status
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/donations?status=available"
    Then I should receive a 200 status code
    And all returned donations should have status "available"

  Scenario: Admin updates a donation
    Given I am authenticated as an admin
    And a donation exists
    When I send a PUT request to "/api/admin/donations/{donationId}" with update data
    Then I should receive a 200 status code
    And the response should contain messageKey "donation.updated"

  Scenario: Admin views audit log
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/audit-log"
    Then I should receive a 200 status code
    And the response should contain recent admin actions

  Scenario: Regular user cannot access admin stats
    Given I am authenticated as a regular user
    When I send a GET request to "/api/admin/stats"
    Then I should receive a 403 status code
    And the response should contain messageKey "auth.admin_required"

  Scenario: Anonymous user cannot access admin routes
    When I send a GET request to "/api/admin/stats"
    Then I should receive a 401 status code