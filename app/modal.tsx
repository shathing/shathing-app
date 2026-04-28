import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <Screen contentStyle={styles.container}>
      <Card variant="elevated" style={styles.card}>
        <ThemedText type="title">Modal</ThemedText>
        <Link href="/" dismissTo style={styles.link}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    maxWidth: 420,
    width: '100%',
  },
  link: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
});
