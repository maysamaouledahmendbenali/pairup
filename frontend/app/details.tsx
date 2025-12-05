import { Stack, useLocalSearchParams } from 'expo-router';

import { ScreenContent } from '@/components/ScreenContent';

export default function Details() {
  const { name } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ title: 'Details' }} />
      <ScreenContent path="screens/details.tsx" title={`Showing details for user ${name}`} />
    </>
  );
}
