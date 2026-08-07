export const reviewPolicy = {
  initialStatus: 'draft',
  reviewerRequiredForApproval: true,
  prohibitedSilentChanges: [
    'source arithmetic discrepancies',
    'source terminology',
    'formula conventions',
    'numeric thresholds or standards',
  ],
} as const;
