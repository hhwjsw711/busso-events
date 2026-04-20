import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { notifications } from "@mantine/notifications";
import { useAPIErrorHandler } from "../../../utils/hooks";
import { formatDate } from "../../../utils/dateUtils";
import {
  Card,
  Title,
  Text,
  Button,
  Group,
  Box,
  Stack,
  SimpleGrid,
  Badge,
  Loader,
} from "@mantine/core";
import { IconRefresh, IconMail } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

// Type guards for subscription types
function isPromptSubscription(
  subscription: any,
): subscription is any & { prompt: string; kind: "prompt" } {
  return (
    subscription.kind === "prompt" ||
    (subscription.prompt !== undefined && subscription.kind !== "all_events")
  );
}

function isAllEventsSubscription(subscription: any): boolean {
  return subscription.kind === "all_events";
}

interface SubscriptionMatchingTestProps {
  subscriptionId: Id<"subscriptions">;
}

export function SubscriptionMatchingTest({
  subscriptionId,
}: SubscriptionMatchingTestProps) {
  const { t } = useTranslation();
  const allSubscriptions = useQuery(
    api.subscriptions.subscriptionsAdmin.getAllSubscriptions,
  );
  const subscription = allSubscriptions?.find(
    (sub: any) => sub._id === subscriptionId,
  );
  const testMatching = useAction(
    api.subscriptions.subscriptionsAdmin.testSubscriptionMatching,
  );
  const previewMatching = useAction(
    api.subscriptions.subscriptionsMatching.previewMatchingEvents,
  );

  const [isTestingMatching, setIsTestingMatching] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<any[] | null>(null);

  const onApiError = useAPIErrorHandler();

  if (allSubscriptions === undefined) {
    return (
      <Card shadow="sm" padding="xl" radius="lg" withBorder>
        <Loader size="lg" />
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card shadow="sm" padding="xl" radius="lg" withBorder>
        <Text c="dimmed" ta="center" py="xl">
          {t("subscriptionDebug.subscriptionNotFound")}
        </Text>
      </Card>
    );
  }

  const loadPreview = () => {
    if (!isPromptSubscription(subscription)) {
      notifications.show({
        message: t("subscriptionDebug.previewOnlyPrompt"),
        color: "red",
      });
      return;
    }

    setIsLoadingPreview(true);
    previewMatching({ prompt: (subscription as any).prompt })
      .then((events) => setPreviewEvents(events))
      .catch(onApiError)
      .finally(() => setIsLoadingPreview(false));
  };

  return (
    <Card shadow="sm" padding="xl" radius="lg" withBorder>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>
          {t("subscriptionDebug.subscriptionMatchingTest")}
        </Title>
        <Group gap="xs">
          {isPromptSubscription(subscription) && (
            <Button
              onClick={loadPreview}
              disabled={isLoadingPreview}
              leftSection={<IconRefresh size={16} />}
              loading={isLoadingPreview}
              variant="light"
            >
              {t("subscriptionDebug.previewMatches")}
            </Button>
          )}
          <Button
            onClick={() => {
              setIsTestingMatching(true);
              testMatching({ subscriptionId })
                .then((result) => {
                  if (result) {
                    notifications.show({
                      message: t("subscriptionDebug.matchingTestSuccess"),
                      color: "green",
                    });
                  } else {
                    notifications.show({
                      message: t("subscriptionDebug.subscriptionNotFound"),
                      color: "red",
                    });
                  }
                })
                .catch(onApiError)
                .finally(() => setIsTestingMatching(false));
            }}
            disabled={isTestingMatching}
            leftSection={<IconMail size={16} />}
            loading={isTestingMatching}
          >
            {t("subscriptionDebug.testMatching")}
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="lg">
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("subscriptionDebug.subscriptionType")}
          </Text>
          <Text size="sm" style={{ lineHeight: 1.6 }}>
            {isPromptSubscription(subscription) ? (
              <>
                <Badge color="orange" size="sm" mr="xs">
                  {t("subscriptionDebug.promptBased")}
                </Badge>
                <br />"{(subscription as any).prompt}"
              </>
            ) : (
              <Badge color="purple" size="sm">
                {t("subscriptionDebug.allEvents")}
              </Badge>
            )}
          </Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("subscriptionDebug.status")}
          </Text>
          <Badge color={subscription.isActive ? "green" : "gray"} size="sm">
            {subscription.isActive
              ? t("subscriptionDebug.active")
              : t("subscriptionDebug.inactive")}
          </Badge>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("subscriptionDebug.emailFrequency")}
          </Text>
          <Text size="sm">{subscription.emailFrequencyHours}h</Text>
        </Box>
        <Box>
          <Text fw={500} size="sm" c="gray.7">
            {t("subscriptionDebug.lastEmail")}
          </Text>
          <Text size="sm">
            {subscription.lastEmailSent
              ? formatDate(subscription.lastEmailSent)
              : t("eventDebug.never")}
          </Text>
        </Box>
      </SimpleGrid>

      {previewEvents && (
        <Box>
          <Title order={3} mb="md">
            {t("subscriptionDebug.previewResults", {
              count: previewEvents.length,
            })}
          </Title>
          {previewEvents.length > 0 ? (
            <Stack gap="sm">
              {previewEvents.slice(0, 5).map((event: any) => (
                <Card key={event._id} withBorder padding="sm" radius="md">
                  <Group justify="space-between">
                    <Box style={{ flex: 1 }}>
                      <Text fw={500} size="sm" lineClamp={1}>
                        {event.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        📅 {formatDate(event.eventDate)}
                      </Text>
                    </Box>
                    <Group gap="xs">
                      <Badge
                        color={
                          event.score >= 0.8
                            ? "green"
                            : event.score >= 0.6
                              ? "yellow"
                              : "red"
                        }
                        size="xs"
                      >
                        {(event.score * 100).toFixed(0)}%
                      </Badge>
                      <Badge
                        color={
                          event.matchType === "semantic" ? "blue" : "grape"
                        }
                        size="xs"
                      >
                        {event.matchType}
                      </Badge>
                      {event.meetsThreshold && (
                        <Badge color="green" size="xs">
                          ✓ {t("subscriptionDebug.match")}
                        </Badge>
                      )}
                    </Group>
                  </Group>
                </Card>
              ))}
              {previewEvents.length > 5 && (
                <Text size="sm" c="dimmed" ta="center">
                  {t("subscriptionDebug.moreEvents", {
                    count: previewEvents.length - 5,
                  })}
                </Text>
              )}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              {t("subscriptionDebug.noMatchingEvents")}
            </Text>
          )}
        </Box>
      )}

      <Card bg="blue.0" padding="md" radius="md" mt="lg">
        <Text size="sm" c="blue.8">
          💡{" "}
          <Text span fw={500}>
            {t("subscriptionDebug.previewMatches")}
          </Text>{" "}
          {t("subscriptionDebug.previewMatchesDescription")}{" "}
          <Text span fw={500}>
            {t("subscriptionDebug.testMatching")}
          </Text>{" "}
          {t("subscriptionDebug.testMatchingDescription")}
        </Text>
      </Card>
    </Card>
  );
}
