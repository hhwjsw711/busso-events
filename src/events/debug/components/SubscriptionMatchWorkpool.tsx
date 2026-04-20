import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { useAPIErrorHandler } from "../../../utils/hooks";
import { formatDateDetailed as formatDate } from "../../../utils/dateUtils";
import {
  Card,
  Title,
  Text,
  Button,
  Group,
  Box,
  SimpleGrid,
  Badge,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useTranslation } from "react-i18next";

interface DebugSectionProps {
  eventId: Id<"events">;
}

export function SubscriptionMatchWorkpool({ eventId }: DebugSectionProps) {
  const { t } = useTranslation();
  const subscriptionMatchWorkpoolStatus = useQuery(
    api.events.events.getSubscriptionMatchWorkpoolStatus,
    { eventId },
  );
  const triggerSubscriptionMatching = useAction(
    api.subscriptions.subscriptionsMatching.triggerSubscriptionMatchingForEvent,
  );

  const [isTriggeringMatching, setIsTriggeringMatching] = useState(false);
  const onApiError = useAPIErrorHandler();

  return (
    <Card shadow="sm" padding="xl" radius="lg" withBorder>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>{t("eventDebug.subscriptionMatching")}</Title>
        <Button
          onClick={() => {
            setIsTriggeringMatching(true);
            triggerSubscriptionMatching({
              eventId,
            })
              .then((result) => {
                if (result.success) {
                  notifications.show({
                    message: t("eventDebug.triggerSuccess"),
                    color: "green",
                  });
                } else {
                  notifications.show({
                    message: t("eventDebug.triggerFailed"),
                    color: "red",
                  });
                }
              })
              .catch(onApiError)
              .finally(() => setIsTriggeringMatching(false));
          }}
          disabled={isTriggeringMatching}
          color="blue"
          leftSection={<IconRefresh size={16} />}
          loading={isTriggeringMatching}
        >
          {isTriggeringMatching
            ? t("eventDebug.triggerNowLoading")
            : t("eventDebug.triggerNow")}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="lg">
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.workpoolId")}:
          </Text>
          <Text ff="monospace" size="sm">
            {subscriptionMatchWorkpoolStatus?.workId ||
              t("eventDebug.notQueued")}
          </Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.enqueuedAt")}:
          </Text>
          <Text size="sm">
            {subscriptionMatchWorkpoolStatus?.enqueuedAt
              ? formatDate(subscriptionMatchWorkpoolStatus.enqueuedAt)
              : t("eventDebug.notQueued")}
          </Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.status")}:
          </Text>
          <Text size="sm">
            {subscriptionMatchWorkpoolStatus?.status ? (
              <Badge
                color={
                  subscriptionMatchWorkpoolStatus.status.state === "pending"
                    ? "yellow"
                    : subscriptionMatchWorkpoolStatus.status.state === "running"
                      ? "blue"
                      : subscriptionMatchWorkpoolStatus.status.state ===
                          "finished"
                        ? "green"
                        : "red"
                }
              >
                {subscriptionMatchWorkpoolStatus.status.state}
                {subscriptionMatchWorkpoolStatus.status.retryCount !==
                  undefined &&
                  subscriptionMatchWorkpoolStatus.status.retryCount > 0 && (
                    <span>
                      {" "}
                      (Retries:{" "}
                      {subscriptionMatchWorkpoolStatus.status.retryCount})
                    </span>
                  )}
              </Badge>
            ) : subscriptionMatchWorkpoolStatus?.error ? (
              <Badge color="red">
                Error: {subscriptionMatchWorkpoolStatus.error}
              </Badge>
            ) : (
              <Badge color="gray">{t("eventDebug.notQueued")}</Badge>
            )}
          </Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.queuePosition")}:
          </Text>
          <Text size="sm">
            {subscriptionMatchWorkpoolStatus?.status?.state === "pending" &&
            subscriptionMatchWorkpoolStatus.status.queuePosition !== undefined
              ? `#${subscriptionMatchWorkpoolStatus.status.queuePosition + 1}`
              : ""}
          </Text>
        </Box>
      </SimpleGrid>

      <Card bg="blue.0" padding="md" radius="md">
        <Text size="sm" c="blue.8">
          🎯{" "}
          <Text span fw={500}>
            {t("eventDebug.subscriptionMatching")}
          </Text>{" "}
          {t("eventDebug.matchingDescription")}
        </Text>
      </Card>
    </Card>
  );
}
