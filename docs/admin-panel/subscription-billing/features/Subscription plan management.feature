Feature: Subscription Plan Management
  As a user
  I want to Subscription plan management
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @subscription-billing @subscription-plan-management
  Scenario: Successfully Subscription plan management
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
