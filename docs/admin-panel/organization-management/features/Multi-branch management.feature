Feature: Multi Branch Management
  As a user
  I want to Multi branch management
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @organization-management @multi-branch-management
  Scenario: Successfully Multi branch management
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
