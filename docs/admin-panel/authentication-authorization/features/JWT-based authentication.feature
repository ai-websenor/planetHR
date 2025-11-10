Feature: JWT Based Authentication
  As a user
  I want to JWT based authentication
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @authentication-authorization @jwt-based-authentication
  Scenario: Successfully JWT based authentication
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
