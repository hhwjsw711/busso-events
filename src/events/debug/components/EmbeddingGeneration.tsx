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
import { IconBrain } from "@tabler/icons-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useTranslation } from "react-i18next";

interface DebugSectionProps {
  eventId: Id<"events">;
}

export function EmbeddingGeneration({ eventId }: DebugSectionProps) {
  const { t } = useTranslation();
  const embeddingWorkpoolStatus = useQuery(
    api.events.events.getEmbeddingWorkpoolStatus,
    {
      eventId,
    },
  );
  const generateEmbedding = useAction(
    api.embeddings.embeddings.generateEventEmbedding,
  );

  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false);
  const onApiError = useAPIErrorHandler();

  return (
    <Card shadow="sm" padding="xl" radius="lg" withBorder>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>{t("eventDebug.embeddingGeneration")}</Title>
        <Button
          onClick={() => {
            setIsGeneratingEmbedding(true);
            generateEmbedding({ eventId })
              .then((result) => {
                if (result.success) {
                  notifications.show({
                    message: t("eventDebug.generateSuccess"),
                    color: "green",
                  });
                } else {
                  notifications.show({
                    message: t("eventDebug.generateFailed"),
                    color: "red",
                  });
                }
              })
              .catch(onApiError)
              .finally(() => setIsGeneratingEmbedding(false));
          }}
          disabled={isGeneratingEmbedding}
          color="purple"
          leftSection={<IconBrain size={16} />}
          loading={isGeneratingEmbedding}
        >
          {isGeneratingEmbedding
            ? t("eventDebug.generateNowLoading")
            : t("eventDebug.generateNow")}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="lg">
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.workpoolId")}:
          </Text>
          <Text ff="monospace" size="sm">
            {embeddingWorkpoolStatus?.workId || t("eventDebug.notQueued")}
          </Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.enqueuedAt")}:
          </Text>
          <Text size="sm">
            {embeddingWorkpoolStatus?.enqueuedAt
              ? formatDate(embeddingWorkpoolStatus.enqueuedAt)
              : t("eventDebug.notQueued")}
          </Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("eventDebug.status")}:
          </Text>
          <Group gap="xs">
            {embeddingWorkpoolStatus?.status ? (
              <>
                <Badge
                  color={
                    embeddingWorkpoolStatus.status.state === "pending"
                      ? "yellow"
                      : embeddingWorkpoolStatus.status.state === "running"
                        ? "blue"
                        : embeddingWorkpoolStatus.status.state === "finished"
                          ? "green"
                          : "red"
                  }
                >
                  {embeddingWorkpoolStatus.status.state}
                </Badge>
                {embeddingWorkpoolStatus.status.retryCount !== undefined &&
                  embeddingWorkpoolStatus.status.retryCount > 0 && (
                    <Text size="xs" c="dimmed">
                      {t("eventDebug.retryCount")}:{" "}
                      {embeddingWorkpoolStatus.status.retryCount}
                    </Text>
                  )}
              </>
            ) : embeddingWorkpoolStatus?.error ? (
              <Badge color="red">Error: {embeddingWorkpoolStatus.error}</Badge>
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
            {embeddingWorkpoolStatus?.status?.state === "pending" &&
            embeddingWorkpoolStatus.status.queuePosition !== undefined
              ? `#${embeddingWorkpoolStatus.status.queuePosition + 1}`
              : ""}
          </Text>
        </Box>
      </SimpleGrid>

      <Card bg="grape.0" padding="md" radius="md">
        <Text size="sm" c="grape.8">
          🧠{" "}
          <Text span fw={500}>
            {t("eventDebug.embeddingGeneration")}
          </Text>{" "}
          {t("eventDebug.embeddingDescription")}
        </Text>
      </Card>
    </Card>
  );
}
