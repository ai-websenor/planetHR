Feature: Role Based Access Control (Owner/Leader/Manager)
  As a user
  I want to Role based access control (Owner/Leader/Manager)
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @authentication-authorization @role-based-access-control-(owner/leader/manager)
  Scenario: Successfully Role based access control (Owner/Leader/Manager)
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
