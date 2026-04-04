Feature: Support Tickets
  As a user of the Et3am platform
  I want to create and manage support tickets
  So that I can report issues and get help

  Background:
    Given the API server is running

  Scenario: User creates a support ticket
    Given I am authenticated as a regular user
    When I send a POST request to "/api/support" with ticket details
    Then I should receive a 201 status code
    And the response should contain messageKey "support.ticket_created"

  Scenario: User creates ticket with invalid type
    Given I am authenticated as a regular user
    When I send a POST request to "/api/support" with invalid ticket type
    Then I should receive a 400 status code
    And the response should contain messageKey "validation.invalid_field"

  Scenario: User creates ticket with missing fields
    Given I am authenticated as a regular user
    When I send a POST request to "/api/support" with missing required fields
    Then I should receive a 400 status code
    And the response should contain messageKey "validation.required_field"

  Scenario: User views their tickets
    Given I am authenticated as a regular user
    And I have created support tickets
    When I send a GET request to "/api/support"
    Then I should receive a 200 status code
    And the response should contain my tickets

  Scenario: User views a specific ticket
    Given I am authenticated as a regular user
    And I have a support ticket
    When I send a GET request to "/api/support/{ticketId}"
    Then I should receive a 200 status code
    And the response should contain the ticket details

  Scenario: User cannot view another user's ticket
    Given I am authenticated as a regular user
    And another user has a support ticket
    When I send a GET request to "/api/support/{otherTicketId}"
    Then I should receive a 403 status code
    And the response should contain messageKey "auth.unauthorized"

  Scenario: Admin views all support tickets
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/tickets"
    Then I should receive a 200 status code
    And the response should contain all tickets

  Scenario: Admin updates a ticket
    Given I am authenticated as an admin
    And a support ticket exists
    When I send a PUT request to "/api/admin/tickets/{ticketId}" with update data
    Then I should receive a 200 status code
    And the response should contain messageKey "support.ticket_updated"

  Scenario: Admin filters tickets by status
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/tickets?status=open"
    Then I should receive a 200 status code
    And all returned tickets should have status "open"

  Scenario: Admin filters tickets by priority
    Given I am authenticated as an admin
    When I send a GET request to "/api/admin/tickets?priority=high"
    Then I should receive a 200 status code
    And all returned tickets should have priority "high"