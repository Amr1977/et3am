Feature: User Authentication
  As a user of the Et3am food donation platform
  I want to authenticate securely
  So that I can access my account and manage donations

  Background:
    Given the API server is running

  Scenario: User registers with email and password
    When I send a POST request to "/api/auth/register" with valid user data
    Then I should receive a 201 status code
    And the response should contain a valid JWT token
    And the user should be created in the database

  Scenario: User logs in with valid credentials
    Given a user exists in the database
    When I send a POST request to "/api/auth/login" with valid credentials
    Then I should receive a 200 status code
    And the response should contain a valid JWT token

  Scenario: User fails login with invalid credentials
    Given a user exists in the database
    When I send a POST request to "/api/auth/login" with wrong password
    Then I should receive a 401 status code
    And the response should contain messageKey "auth.invalid_credentials"

  Scenario: Authenticated user accesses protected route
    Given I am authenticated as a regular user
    When I send a GET request to "/api/donations/my-donations"
    Then I should receive a 200 status code

  Scenario: Unauthenticated user cannot access protected route
    When I send a GET request to "/api/donations/my-donations"
    Then I should receive a 401 status code

  Scenario: User authenticates with Google OAuth
    Given a valid Google OAuth token
    When I send a POST request to "/api/auth/google" with the token
    Then I should receive a 200 status code
    And the response should contain a valid JWT token
    And the user profile should be created from Google data

  Scenario: Admin accesses admin-only route
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/stats"
    Then I should receive a 200 status code

  Scenario: Regular user cannot access admin route
    Given I am authenticated as a regular user
    When I send a GET request to "/api/admin/stats"
    Then I should receive a 403 status code
    And the response should contain messageKey "auth.admin_required"