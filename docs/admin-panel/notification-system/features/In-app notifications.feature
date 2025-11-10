Feature: In App Notifications
  As a user
  I want to In app notifications
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @notification-system @in-app-notifications
  Scenario: Successfully In app notifications
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
