Feature: Chat System
  As a donor or receiver on the Et3am platform
  I want to communicate with each other about donations
  So that we can coordinate pickup and delivery

  Background:
    Given the API server is running

  Scenario: User sends a message in chat
    Given a reserved donation exists
    And I am a participant in the donation
    When I send a POST request to "/api/chat/{donationId}" with a message
    Then I should receive a 200 status code
    And the message should be saved in the database

  Scenario: Non-participant cannot access chat
    Given a reserved donation exists
    And I am not a participant
    When I send a GET request to "/api/chat/{donationId}"
    Then I should receive a 403 status code
    And the response should contain messageKey "auth.unauthorized"

  Scenario: User retrieves chat messages
    Given I am a participant in a donation with messages
    When I send a GET request to "/api/chat/{donationId}"
    Then I should receive a 200 status code
    And the response should contain messages

  Scenario: User cannot chat about available donation
    Given an available donation exists
    When I send a POST request to "/api/chat/{donationId}" with a message
    Then I should receive a 400 status code
    And the response should contain messageKey "donation.not_available"

  Scenario: User marks messages as read
    Given I am a participant in a donation with unread messages
    When I send a PUT request to "/api/chat/{donationId}/read"
    Then I should receive a 200 status code

  Scenario: User gets unread message count
    Given I am authenticated as a regular user
    And I have unread messages
    When I send a GET request to "/api/chat/unread/count"
    Then I should receive a 200 status code
    And the response should contain unreadCount

  Scenario: Empty message is rejected
    Given a reserved donation exists
    And I am a participant
    When I send a POST request to "/api/chat/{donationId}" with empty message
    Then I should receive a 400 status code
    And the response should contain messageKey "validation.required_field"