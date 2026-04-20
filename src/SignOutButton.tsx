"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@mantine/core";
import { useTranslation } from "react-i18next";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button variant="default" size="sm" onClick={() => void signOut()}>
      {t("common.signOut")}
    </Button>
  );
}
