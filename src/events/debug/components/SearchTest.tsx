import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { useAPIErrorHandler } from "../../../utils/hooks";
import {
  Card,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Box,
  Stack,
  TextInput,
  Alert,
} from "@mantine/core";
import {
  IconSearch,
  IconBrain,
  IconCheck,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useTranslation } from "react-i18next";

interface DebugSectionProps {
  eventId: Id<"events">;
}

export function SearchTest({ eventId }: DebugSectionProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const enhancedSearch = useAction(api.events.events.enhancedSearch);
  const onApiError = useAPIErrorHandler();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      notifications.show({
        message: t("eventDebug.pleaseEnterSearch"),
        color: "red",
      });
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await enhancedSearch({
        searchTerm: searchTerm.trim(),
        dateFilter: "all",
      });

      setSearchResults(results);

      // Check if current event is in results
      const eventFound = results.some((event: any) => event._id === eventId);
      const currentEventInResults = results.find(
        (event: any) => event._id === eventId,
      );

      if (eventFound) {
        notifications.show({
          message: `✅ ${t("eventDebug.eventAppears")} ${currentEventInResults?._searchType ? `(${currentEventInResults._searchType} search)` : ""}`,
          color: "green",
        });
      } else {
        notifications.show({
          message: `❌ ${t("eventDebug.eventNotAppears")}`,
          color: "red",
        });
      }
    } catch (error) {
      console.error("Search test failed:", error);
      setSearchError(t("eventDebug.searchFailed"));
    } finally {
      setIsSearching(false);
    }
  };

  const currentEventInResults = searchResults?.find(
    (event: any) => event._id === eventId,
  );
  const isEventFound = !!currentEventInResults;
  const isSemanticSearch = searchTerm.trim().length > 3;

  return (
    <Card shadow="sm" padding="xl" radius="lg" withBorder>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>{t("eventDebug.searchTest")}</Title>
        <Badge
          color={isSemanticSearch ? "blue" : "gray"}
          leftSection={
            isSemanticSearch ? (
              <IconBrain size={12} />
            ) : (
              <IconSearch size={12} />
            )
          }
        >
          {isSemanticSearch
            ? t("eventDebug.aiTextSearch")
            : t("eventDebug.textSearchOnly")}
        </Badge>
      </Group>

      <Stack gap="md">
        <Group gap="sm">
          <TextInput
            placeholder={t("eventDebug.enterSearchTerm")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            style={{ flex: 1 }}
            leftSection={<IconSearch size={16} />}
          />
          <Button
            onClick={handleSearch}
            loading={isSearching}
            disabled={!searchTerm.trim() || isSearching}
          >
            {isSearching
              ? t("eventDebug.searching")
              : t("eventDebug.testSearch")}
          </Button>
        </Group>

        {searchError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {searchError}
          </Alert>
        )}

        {searchResults && (
          <Card bg="gray.0" padding="md" radius="md">
            <Group justify="space-between" align="center" mb="sm">
              <Text fw={500} size="sm">
                {t("eventDebug.searchResults", { count: searchResults.length })}
              </Text>
              <Badge
                color={isEventFound ? "green" : "red"}
                leftSection={
                  isEventFound ? <IconCheck size={12} /> : <IconX size={12} />
                }
              >
                {isEventFound
                  ? t("eventDebug.eventFound")
                  : t("eventDebug.eventNotFound")}
              </Badge>
            </Group>

            {isEventFound && currentEventInResults && (
              <Box
                p="sm"
                bg="green.0"
                style={{
                  borderRadius: "6px",
                  border: "1px solid var(--mantine-color-green-3)",
                }}
              >
                <Group justify="space-between" align="center">
                  <Text size="sm" fw={500} c="green.8">
                    ✅ {t("eventDebug.eventAppears")}
                  </Text>
                  <Group gap="xs">
                    {currentEventInResults._searchType && (
                      <Badge size="sm" color="green" variant="light">
                        {currentEventInResults._searchType}
                      </Badge>
                    )}
                    {currentEventInResults._score && (
                      <Badge size="sm" color="blue" variant="light">
                        Score: {currentEventInResults._score.toFixed(3)}
                      </Badge>
                    )}
                  </Group>
                </Group>
              </Box>
            )}

            {!isEventFound && searchResults.length > 0 && (
              <Box
                p="sm"
                bg="red.0"
                style={{
                  borderRadius: "6px",
                  border: "1px solid var(--mantine-color-red-3)",
                }}
              >
                <Text size="sm" fw={500} c="red.8">
                  ❌ {t("eventDebug.eventNotAppears")}
                </Text>
                <Text size="xs" c="red.6" mt="xs">
                  {t("eventDebug.tryDifferentSearch")}
                </Text>
              </Box>
            )}

            {searchResults.length === 0 && (
              <Box
                p="sm"
                bg="yellow.0"
                style={{
                  borderRadius: "6px",
                  border: "1px solid var(--mantine-color-yellow-3)",
                }}
              >
                <Text size="sm" fw={500} c="yellow.8">
                  ⚠️ {t("eventDebug.noEventsFound")}
                </Text>
              </Box>
            )}
          </Card>
        )}

        <Card bg="violet.0" padding="md" radius="md">
          <Text size="sm" c="violet.8">
            🔍{" "}
            <Text span fw={500}>
              {t("eventDebug.searchTest")}
            </Text>{" "}
            {t("eventDebug.searchTestDescription")}
          </Text>
        </Card>
      </Stack>
    </Card>
  );
}
