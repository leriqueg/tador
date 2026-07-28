/**
 * Port: admin statistics read queries (013 US5).
 */

export interface AdminStatisticsReadRepository {
  listUserCreatedAts(from: Date, toExclusive: Date): Promise<Date[]>;
  listSessionCreatedAts(
    from: Date,
    toExclusive: Date,
  ): Promise<Array<{ createdAt: Date; userId: string }>>;
  listApunteCreatedAts(from: Date, toExclusive: Date): Promise<Date[]>;
}
