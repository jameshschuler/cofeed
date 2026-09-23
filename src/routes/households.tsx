import { createFileRoute } from "@tanstack/react-router";
import { Households } from "../components/Households";
import {
  HouseholdProvider,
  type HouseholdActions,
  type HouseholdState,
} from "../components/household-context";
import { AuthLoading } from "../components/AuthLoading";
import { PrivateLayout } from "../components/PrivateLayout";
import { RouteShell } from "../components/RouteShell";
import { SessionRequired } from "../components/SessionRequired";
import { useRouteScreen } from "../hooks/useRouteScreen";

function HouseholdsPage() {
  const {
    isAuthReady,
    session,
    errorMessage,
    successMessage,
    goTo,
    joinCode,
    isJoiningHousehold,
    setJoinCode,
    joinHousehold,
    householdJoinCode,
    householdRole,
    handleCopyHouseholdCode,
    households,
    isLoadingHouseholds,
    leavingHouseholdId,
    leaveHousehold,
    membersByHousehold,
    removingMemberKey,
    removeMember,
    babyProfile,
    isSavingBabyProfile,
    saveBabyProfile,
  } = useRouteScreen("households");

  if (!isAuthReady) {
    return <AuthLoading />;
  }

  if (!session) {
    return (
      <RouteShell>
        <SessionRequired onGoToLogin={() => goTo("login")} />
      </RouteShell>
    );
  }

  return (
    <RouteShell>
      <PrivateLayout
        screen="households"
        errorMessage={errorMessage}
        successMessage={successMessage}
        onNavigate={goTo}
      >
        <HouseholdProvider
          state={
            {
              joinCode,
              isJoiningHousehold,
              householdJoinCode,
              householdRole,
              households,
              isLoadingHouseholds,
              leavingHouseholdId,
              membersByHousehold,
              removingMemberKey,
              babyProfile,
              isSavingBabyProfile,
            } satisfies HouseholdState
          }
          actions={
            {
              onJoinCodeChange: setJoinCode,
              onJoinHousehold: () => void joinHousehold(),
              onLeaveHousehold: (householdId) => void leaveHousehold(householdId),
              onRemoveMember: (householdId, memberUserId) =>
                void removeMember(householdId, memberUserId),
              onSaveBabyProfile: (name, dateOfBirth) =>
                void saveBabyProfile(name, dateOfBirth),
              onCopyHouseholdCode: () => void handleCopyHouseholdCode(),
            } satisfies HouseholdActions
          }
        >
          <Households />
        </HouseholdProvider>
      </PrivateLayout>
    </RouteShell>
  );
}

export const Route = createFileRoute("/households")({
  component: HouseholdsPage,
});
