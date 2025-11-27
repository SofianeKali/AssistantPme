import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check if QueryClientProvider context is available
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch {
    // If not available, return loading state
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
    };
  }

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
