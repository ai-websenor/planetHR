Feature: Notification Preferences Management
  As a user
  I want to Notification preferences management
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @notification-system @notification-preferences-management
  Scenario: Successfully Notification preferences management
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
