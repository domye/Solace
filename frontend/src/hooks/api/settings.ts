import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getImageSettings, updateImageSettings } from '@/api';
import type { ImageSettings } from '@/types';

export const imageSettingsQueryKey = ['settings', 'images'] as const;

export function useImageSettings() {
	return useQuery({
		queryKey: imageSettingsQueryKey,
		queryFn: getImageSettings,
		staleTime: 10 * 60 * 1000,
	});
}

export function useUpdateImageSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (settings: ImageSettings) => updateImageSettings(settings),
		onSuccess: (settings) => {
			queryClient.setQueryData(imageSettingsQueryKey, settings);
		},
	});
}
