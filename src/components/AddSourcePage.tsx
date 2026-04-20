import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { notifications } from "@mantine/notifications";
import { TestScrapeProgress } from "./TestScrapeProgress";
import { useAPIErrorHandler } from "../utils/hooks";
import { routes } from "../router";
import { useTranslation } from "react-i18next";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Stack,
  Group,
  TextInput,
  Alert,
  Box,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconSearch,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface AddSourcePageProps {
  onBack: () => void;
}

export function AddSourcePage({ onBack }: AddSourcePageProps) {
  const { t } = useTranslation();
  const createSource = useMutation(api.eventSources.eventSourcesAdmin.create);
  const startTestScrape = useMutation(
    api.eventSources.eventSourcesAdmin.startTestScrape,
  );

  const [currentTestScrapeId, setCurrentTestScrapeId] =
    useState<Id<"testScrapes"> | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    startingUrl: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const onApiError = useAPIErrorHandler();

  return (
    <Container size="md">
      <Stack gap="lg">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={() => void onBack()}
          style={{ alignSelf: "flex-start" }}
        >
          {t("admin.sources.backToSources")}
        </Button>
        <Box>
          <Title order={1} size="2.5rem">
            {t("admin.sources.addEventSource")}
          </Title>
          <Text c="dimmed" mt="xs">
            {t("admin.sources.addEventSourceDescription")}
          </Text>
        </Box>
        <Card shadow="sm" padding="xl" radius="lg" withBorder>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsLoading(true);

              createSource({
                name: formData.name,
                startingUrl: formData.startingUrl,
              })
                .then(() => {
                  notifications.show({
                    message: t("admin.sources.createdSuccess"),
                    color: "green",
                  });
                  routes.sources().push();
                })
                .catch(onApiError)
                .finally(() => setIsLoading(false));
            }}
          >
            <Stack gap="lg">
              <TextInput
                label={t("admin.sources.sourceName")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("admin.sources.sourceNamePlaceholder")}
                required
              />
              <Box>
                <TextInput
                  label={t("admin.sources.startingUrl")}
                  type="url"
                  value={formData.startingUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, startingUrl: e.target.value })
                  }
                  placeholder={t("admin.sources.startingUrlPlaceholder")}
                  required
                />
                <Text size="sm" c="dimmed" mt="xs">
                  {t("admin.sources.startingUrlDescription")}
                </Text>
              </Box>

              <Alert
                icon={<IconAlertTriangle size={16} />}
                title={t("admin.sources.importantNote")}
                color="yellow"
              >
                {t("admin.sources.importantNoteDescription")}
              </Alert>
              <Group justify="space-between">
                <Button
                  type="button"
                  onClick={() => void onBack()}
                  variant="default"
                  size="lg"
                  style={{ flex: 1 }}
                >
                  {t("admin.sources.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    startTestScrape({ url: formData.startingUrl })
                      .then((testScrapeId) =>
                        setCurrentTestScrapeId(testScrapeId),
                      )
                      .catch(onApiError)
                      .finally(() => setIsLoading(false));
                  }}
                  disabled={!formData.startingUrl}
                  color="yellow"
                  size="lg"
                  style={{ flex: 1 }}
                  leftSection={<IconSearch size={16} />}
                >
                  {t("admin.sources.testScrape")}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  style={{ flex: 1 }}
                  loading={isLoading}
                >
                  {isLoading
                    ? t("admin.sources.creating")
                    : t("admin.sources.createSource")}
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
        <Card shadow="sm" padding="lg" radius="lg" withBorder>
          <TestScrapeProgress testScrapeId={currentTestScrapeId} />
        </Card>
      </Stack>
    </Container>
  );
}
