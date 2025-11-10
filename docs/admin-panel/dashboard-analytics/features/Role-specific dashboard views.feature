Feature: Role Specific Dashboard Views
  As a user
  I want to Role specific dashboard views
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @dashboard-analytics @role-specific-dashboard-views
  Scenario: Successfully Role specific dashboard views
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
