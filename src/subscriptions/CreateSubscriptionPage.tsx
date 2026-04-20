import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { notifications } from "@mantine/notifications";
import { useAPIErrorHandler } from "../utils/hooks";
import { useTranslation } from "react-i18next";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Stack,
  Group,
  Textarea,
  Box,
  SegmentedControl,
  Alert,
} from "@mantine/core";
import { IconArrowLeft, IconInfoCircle } from "@tabler/icons-react";
import { SubscriptionPreview } from "./components/SubscriptionPreview";

interface CreateSubscriptionPageProps {
  onBack: () => void;
}

export function CreateSubscriptionPage({
  onBack,
}: CreateSubscriptionPageProps) {
  const { t } = useTranslation();
  const createPromptSubscription = useMutation(
    api.subscriptions.subscriptions.createPrompt,
  );
  const createAllEventsSubscription = useMutation(
    api.subscriptions.subscriptions.createAllEvents,
  );

  const [subscriptionType, setSubscriptionType] = useState<
    "prompt" | "all_events"
  >("prompt");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onApiError = useAPIErrorHandler();

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={onBack}
          style={{ alignSelf: "flex-start" }}
        >
          {t("subscriptions.backToSubscriptions")}
        </Button>

        <Box>
          <Title order={1} size="2.5rem">
            {t("subscriptions.createTitle")}
          </Title>
          <Text c="dimmed" mt="xs">
            {t("subscriptions.createDescription")}
          </Text>
        </Box>

        <Card shadow="sm" padding="xl" radius="lg" withBorder>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (subscriptionType === "prompt" && !prompt.trim()) {
                notifications.show({
                  message: t("subscriptions.enterPrompt"),
                  color: "red",
                });
                return;
              }

              setIsLoading(true);

              if (subscriptionType === "prompt") {
                createPromptSubscription({
                  prompt: prompt.trim(),
                  isActive: true,
                })
                  .then(() => {
                    notifications.show({
                      message: t("subscriptions.createdSuccess"),
                      color: "green",
                    });
                    onBack();
                  })
                  .catch(onApiError)
                  .finally(() => setIsLoading(false));
              } else {
                createAllEventsSubscription({
                  isActive: true,
                })
                  .then(() => {
                    notifications.show({
                      message: t("subscriptions.createdSuccess"),
                      color: "green",
                    });
                    onBack();
                  })
                  .catch(onApiError)
                  .finally(() => setIsLoading(false));
              }
            }}
          >
            <Stack gap="lg">
              <Box>
                <Text fw={500} size="sm" mb="xs">
                  {t("subscriptions.subscriptionType")}
                </Text>
                <SegmentedControl
                  value={subscriptionType}
                  onChange={(value) =>
                    setSubscriptionType(value as "prompt" | "all_events")
                  }
                  data={[
                    {
                      label: t("subscriptions.specificInterests"),
                      value: "prompt",
                    },
                    {
                      label: t("subscriptions.allEvents"),
                      value: "all_events",
                    },
                  ]}
                  fullWidth
                />
                <Text size="sm" c="dimmed" mt="xs">
                  {t("subscriptions.subscriptionTypeDescription")}
                </Text>
              </Box>

              {subscriptionType === "all_events" && (
                <Alert
                  icon={<IconInfoCircle size={16} />}
                  color="blue"
                  variant="light"
                >
                  {t("subscriptions.allEventsWarning")}
                </Alert>
              )}

              {subscriptionType === "prompt" && (
                <Box>
                  <Text fw={500} size="sm" mb="xs">
                    {t("subscriptions.promptQuestion")}
                  </Text>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t("subscriptions.promptPlaceholder")}
                    rows={4}
                    required
                    autosize
                  />
                  <Text size="sm" c="dimmed" mt="xs">
                    {t("subscriptions.promptDescription")}
                  </Text>
                </Box>
              )}

              {subscriptionType === "prompt" && (
                <SubscriptionPreview prompt={prompt} onError={onApiError} />
              )}

              <Group justify="space-between" pt="md">
                <Button
                  type="button"
                  onClick={onBack}
                  variant="default"
                  size="lg"
                  style={{ flex: 1 }}
                >
                  {t("subscriptions.cancel")}
                </Button>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    (subscriptionType === "prompt" && !prompt.trim())
                  }
                  size="lg"
                  style={{ flex: 1 }}
                  loading={isLoading}
                >
                  {isLoading
                    ? t("subscriptions.creating")
                    : t("subscriptions.createSubscription")}
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
}
