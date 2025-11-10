Feature: Email Notifications
  As a user
  I want to Email notifications
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @notification-system @email-notifications
  Scenario: Successfully Email notifications
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
