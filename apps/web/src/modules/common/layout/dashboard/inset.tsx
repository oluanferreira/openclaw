export const DashboardInset = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="@container/dashboard mx-auto flex w-full max-w-7xl flex-1 flex-col items-start gap-6 p-6 lg:p-8">
      {children}
    </div>
  );
};
