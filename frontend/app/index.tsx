import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';

import { ScreenContent } from '@/components/ScreenContent';

export default function Home() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white px-4">
      <ScreenContent path="app/index.tsx" title="Home" />

      <View className={styles.buttonWrapper} style={{ paddingBottom: insets.bottom }}>
        <Button
          title="Show Details"
          onPress={() => router.push({ pathname: '/details', params: { name: 'Dan' } })}
        />
      </View>
    </View>
  );
}

const styles = {
  buttonWrapper: 'w-full',
  container: 'flex flex-1 bg-white px-4',
};
