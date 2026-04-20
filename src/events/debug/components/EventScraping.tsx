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
  Badge,
  Box,
  SimpleGrid,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useTranslation } from "react-i18next";

interface DebugSectionProps {
  eventId: Id<"events">;
}

export function EventScraping({ eventId }: DebugSectionProps) {
  const { t } = useTranslation();
  const workpoolStatus = useQuery(api.events.events.getWorkpoolStatus, {
    eventId,
  });
  const scrapeEvent = useAction(api.events.eventsAdmin.scrapeEvent);

  const [isScraping, setIsScraping] = useState(false);
  const onApiError = useAPIErrorHandler();

  return (
    <Card shadow="sm" padding="xl" radius="lg" withBorder>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>{t("eventDebug.eventScraping")}</Title>
        <Button
          onClick={() => {
            setIsScraping(true);
            scrapeEvent({ eventId })
              .then((result) => {
                if (result.success) {
                  notifications.show({
                    message: t("eventDebug.scrapeSuccess"),
                    color: "green",
                  });
                } else {
                  notifications.show({
                    message: t("eventDebug.scrapeFailed", {
                      message: result.message,
                    }),
                    color: "red",
                  });
                }
              })
              .catch(onApiError)
              .finally(() => setIsScraping(false));
          }}
          disabled={isScraping}
          color="yellow"
          leftSection={<IconSearch size={16} />}
          loading={isScraping}
        >
          {isScraping
            ? t("eventDebug.scrapeNowLoading")
            : t("eventDebug.scrapeNow")}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="lg">
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.workpoolId")}:
          </Text>
          <Text ff="monospace" size="sm">
            {workpoolStatus?.workId || t("eventDebug.notQueued")}
          </Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.enqueuedAt")}:
          </Text>
          <Text size="sm">
            {workpoolStatus?.enqueuedAt
              ? formatDate(workpoolStatus.enqueuedAt)
              : t("eventDebug.notQueued")}
          </Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.status")}:
          </Text>
          <Group gap="xs">
            {workpoolStatus?.status ? (
              <>
                <Badge
                  color={
                    workpoolStatus.status.state === "pending"
                      ? "yellow"
                      : workpoolStatus.status.state === "running"
                        ? "blue"
                        : workpoolStatus.status.state === "finished"
                          ? "green"
                          : "red"
                  }
                >
                  {workpoolStatus.status.state}
                </Badge>
                {workpoolStatus.status.retryCount !== undefined &&
                  workpoolStatus.status.retryCount > 0 && (
                    <Text size="xs" c="dimmed">
                      {t("eventDebug.retryCount")}:{" "}
                      {workpoolStatus.status.retryCount}
                    </Text>
                  )}
              </>
            ) : workpoolStatus?.error ? (
              <Badge color="red">Error: {workpoolStatus.error}</Badge>
            ) : (
              <Text size="sm" c="gray.6">
                {t("eventDebug.notQueued")}
              </Text>
            )}
          </Group>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.queuePosition")}:
          </Text>
          <Text size="sm">
            {workpoolStatus?.status?.state === "pending" &&
            workpoolStatus.status.queuePosition !== undefined
              ? `#${workpoolStatus.status.queuePosition + 1}`
              : ""}
          </Text>
        </Box>
      </SimpleGrid>

      <Card bg="yellow.0" padding="md" radius="md">
        <Text size="sm" c="yellow.8">
          🕷️{" "}
          <Text span fw={500}>
            {t("eventDebug.eventScraping")}
          </Text>{" "}
          {t("eventDebug.scrapingDescription")}
        </Text>
      </Card>
    </Card>
  );
}
