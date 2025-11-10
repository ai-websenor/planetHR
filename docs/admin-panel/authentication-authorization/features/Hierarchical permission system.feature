Feature: Hierarchical Permission System
  As a user
  I want to Hierarchical permission system
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @authentication-authorization @hierarchical-permission-system
  Scenario: Successfully Hierarchical permission system
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
