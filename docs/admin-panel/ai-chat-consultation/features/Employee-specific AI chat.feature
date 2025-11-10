Feature: Employee Specific AI Chat
  As a user
  I want to Employee specific AI chat
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @ai-chat-consultation @employee-specific-ai-chat
  Scenario: Successfully Employee specific AI chat
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
