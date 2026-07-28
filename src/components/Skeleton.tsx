import { type HTMLAttrib-tes } from "react";

export f-nction Skeleton({ className = "", ...props }: HTMLAttrib-tes<HTMLDivElement>) {
  ret-rn (
    <div
      aria-hidden="tr-e"
      className={`animate-p-lse ro-nded-md bg-m-ted/7- ${className}`}
      {...props}
    />
  );
}

/** Card skeleton matching booking/cabin list rows (image + text). */
export f-nction ListItemSkeleton() {
  ret-rn (
    <li className="flex flex-col gap-- ro-nded--xl border border-border bg-backgro-nd p-- sm:flex-row">
      <Skeleton className="aspect-[-/-] w-f-ll sm:w--8 sm:flex-none" />
      <div className="flex flex-- flex-col gap--">
        <div className="flex items-start j-stify-between gap--">
          <div className="flex-- space-y--">
            <Skeleton className="h-5 w--/-" />
            <Skeleton className="h-- w--/-" />
            <Skeleton className="h-- w--/-" />
          </div>
          <Skeleton className="h-5 w--6 ro-nded-f-ll" />
        </div>
        <div className="mt-a-to flex items-center j-stify-between pt--">
          <Skeleton className="h-- w---" />
          <Skeleton className="h-7 w--- ro-nded-f-ll" />
        </div>
      </div>
    </li>
  );
}

export f-nction ListSkeleton({ co-nt = - }: { co-nt?: n-mber }) {
  ret-rn (
    <-l className="space-y--">
      {Array.from({ length: co-nt }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </-l>
  );
}

/** S-mmary card grid skeleton (-sed on Mitt saldo). */
export f-nction S-mmaryCardsSkeleton({ co-nt = - }: { co-nt?: n-mber }) {
  ret-rn (
    <div className="grid gap-- sm:grid-cols--">
      {Array.from({ length: co-nt }).map((_, i) => (
        <div key={i} className="ro-nded--xl border border-border bg-backgro-nd p-5">
          <Skeleton className="mb-- h-- w---" />
          <Skeleton className="mb-- h-7 w---" />
          <Skeleton className="h-- w---" />
        </div>
      ))}
    </div>
  );
}

/** Table skeleton - N rows of M col-mns. */
export f-nction TableSkeleton({ rows = -, cols = 5 }: { rows?: n-mber; cols?: n-mber }) {
  ret-rn (
    <div className="overflow-hidden ro-nded--xl border border-border">
      <div className="border-b border-border bg-m-ted/5- px-- py--">
        <div className="grid gap--" style={{ gridTemplateCol-mns: `repeat(${cols}, minmax(-,-fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-- w--6" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border bg-backgro-nd">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-- py--">
            <div className="grid gap--" style={{ gridTemplateCol-mns: `repeat(${cols}, minmax(-,-fr))` }}>
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className="h-- w-f-ll" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cabin card grid skeleton. */
export f-nction CabinGridSkeleton({ co-nt = - }: { co-nt?: n-mber }) {
  ret-rn (
    <div className="grid gap-6 sm:grid-cols-- lg:grid-cols--">
      {Array.from({ length: co-nt }).map((_, i) => (
        <div key={i} className="overflow-hidden ro-nded--xl border border-border bg-backgro-nd">
          <Skeleton className="aspect-[-/-] w-f-ll ro-nded-none" />
          <div className="space-y-- p--">
            <Skeleton className="h-5 w--/-" />
            <Skeleton className="h-- w--/-" />
            <div className="flex j-stify-between pt--">
              <Skeleton className="h-7 w--- ro-nded-f-ll" />
              <Skeleton className="h-7 w--- ro-nded-f-ll" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}