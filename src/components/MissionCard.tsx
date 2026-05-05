import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { missionPathLabel, missionStageLabel, upsertMission } from '../missions';
import { typography } from './theme';
import Card from './Card';
import Pill from './Pill';

interface MissionCardProps {
  mission: ReturnType<typeof upsertMission>[number];
}

export default function MissionCard({ mission }: MissionCardProps) {
  return (
    <Card style={styles.missionCard}>
      <Text style={typography.successLabel}>Fehler-Mission</Text>
      <Text style={typography.cardTitle}>{mission.title}</Text>
      <Text style={typography.muted}>{missionPathLabel(mission)}</Text>
      <View style={styles.rowWrap}>
        <Pill label={`Jetzt: ${missionStageLabel(mission.stage)}`} tone="warm" />
        <Pill label={mission.status} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  missionCard: {
    backgroundColor: '#FDF6E3',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
});
