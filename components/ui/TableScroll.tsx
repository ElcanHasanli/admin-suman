export function TableScroll({
  children,
  minWidth = 640,
}: {
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:px-0">
      <div className="w-full" style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}
