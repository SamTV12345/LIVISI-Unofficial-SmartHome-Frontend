import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { i18next } from "@/src/language/i18n";
import { queryClient } from "@/src/api/queryClient";

type TestProvidersProps = {
  children: ReactNode;
};

export const TestProviders = ({ children }: TestProvidersProps) => {

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
};

