import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Stack,
  Group,
  Loader,
  Center,
  Box,
} from "@mantine/core";
import { SubscriptionCard } from "./SubscriptionCard";

interface SubscriptionsPageProps {
  onCreateNew: () => void;
  onNavigateToSubscription: (subscriptionId: Id<"subscriptions">) => void;
}

export function SubscriptionsPage({
  onCreateNew,
  onNavigateToSubscription,
}: SubscriptionsPageProps) {
  const subscriptions = useQuery(api.subscriptions.subscriptions.list);

  if (subscriptions === undefined) {
    return (
      <Container size="xl" pt="6rem">
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="6rem">
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={1} size="2.5rem">
            Event Subscriptions
          </Title>
          <Text c="dimmed" mt="xs">
            Manage your event notification preferences
          </Text>
        </Box>
        <Button onClick={onCreateNew} size="lg">
          + Create Subscription
        </Button>
      </Group>

      {subscriptions.length === 0 ? (
        <Card
          shadow="sm"
          padding="xl"
          radius="lg"
          style={{ textAlign: "center" }}
        >
          <Text size="4rem" style={{ marginBottom: "1rem" }}>
            📧
          </Text>
          <Title order={3} mb="xs">
            No subscriptions yet
          </Title>
          <Text c="dimmed" mb="lg">
            Create your first subscription to get notified about events that
            match your interests
          </Text>
          <Button onClick={onCreateNew} size="lg">
            Create Your First Subscription
          </Button>
        </Card>
      ) : (
        <Stack gap="lg">
          {subscriptions.map((subscription: any) => (
            <SubscriptionCard
              key={subscription._id}
              subscription={subscription}
              onClick={() => onNavigateToSubscription(subscription._id)}
            />
          ))}
        </Stack>
      )}
    </Container>
  );
}
