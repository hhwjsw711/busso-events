import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Stack,
  Group,
  TextInput,
  Box,
  Badge,
} from "@mantine/core";
import { IconArrowLeft, IconSearch } from "@tabler/icons-react";
import { SubscriptionMatchingTest } from "./components/SubscriptionMatchingTest";
import { SubscriptionStats } from "./components/SubscriptionStats";
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

interface SubscriptionDebugPageProps {
  onBack: () => void;
}

export function SubscriptionDebugPage({ onBack }: SubscriptionDebugPageProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] =
    useState<Id<"subscriptions"> | null>(null);

  const subscriptions = useQuery(
    api.subscriptions.subscriptionsAdmin.getAllSubscriptions,
  );

  const filteredSubscriptions = subscriptions?.filter((sub: any) => {
    const promptMatch = isPromptSubscription(sub)
      ? (sub as any).prompt.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    const userIdMatch = sub.userId
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const typeMatch =
      searchQuery.toLowerCase().includes("all events") &&
      isAllEventsSubscription(sub);

    return promptMatch || userIdMatch || typeMatch;
  });

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Button
            leftSection={<IconArrowLeft size={16} />}
            variant="subtle"
            onClick={onBack}
          >
            {t("subscriptionDebug.backToAdmin")}
          </Button>
          <Title order={1}>{t("subscriptionDebug.title")}</Title>
        </Group>

        <SubscriptionStats />

        <Card shadow="sm" padding="xl" radius="lg" withBorder>
          <Title order={2} mb="lg">
            {t("subscriptionDebug.searchSubscriptions")}
          </Title>
          <TextInput
            placeholder={t("subscriptionDebug.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            mb="lg"
          />

          {filteredSubscriptions && filteredSubscriptions.length > 0 ? (
            <Stack gap="sm">
              {filteredSubscriptions.map((subscription: any) => (
                <Card
                  key={subscription._id}
                  withBorder
                  padding="md"
                  radius="md"
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedSubscriptionId === subscription._id
                        ? "var(--mantine-color-blue-0)"
                        : undefined,
                  }}
                  onClick={() => setSelectedSubscriptionId(subscription._id)}
                >
                  <Group justify="space-between">
                    <Box>
                      <Text fw={500} size="sm" lineClamp={1}>
                        {isPromptSubscription(subscription) ? (
                          <>
                            <Badge color="orange" size="xs" mr="xs">
                              {t("subscriptionDebug.prompt")}
                            </Badge>
                            {(subscription as any).prompt}
                          </>
                        ) : (
                          <>
                            <Badge color="purple" size="xs" mr="xs">
                              {t("subscriptionDebug.allEvents")}
                            </Badge>
                            {t("subscriptionDebug.allEventsSubscription")}
                          </>
                        )}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t("subscriptionDebug.user")} {subscription.userId}{" "}
                        {t("subscriptionDebug.status")}{" "}
                        {subscription.isActive
                          ? t("subscriptionDebug.active")
                          : t("subscriptionDebug.inactive")}
                      </Text>
                    </Box>
                    <Text size="xs" c="dimmed">
                      {subscription.emailFrequencyHours}
                      {t("subscriptionDebug.frequency")}
                    </Text>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              {t("subscriptionDebug.noSubscriptionsFound")}
            </Text>
          )}
        </Card>

        {selectedSubscriptionId && (
          <SubscriptionMatchingTest subscriptionId={selectedSubscriptionId} />
        )}
      </Stack>
    </Container>
  );
}
