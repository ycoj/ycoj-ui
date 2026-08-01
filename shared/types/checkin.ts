export type CheckinFortune = 'da_ji' | 'ji' | 'ping' | 'xiong' | 'da_xiong';

export type CheckinRecord = {
  date: string;
  fortune: CheckinFortune;
  hitokoto: {
    id: number;
    uuid: string;
    text: string;
    type: string;
    from: string;
    fromWho: string | null;
  };
};

export type HomepageCheckin = {
  timezone: 'UTC+08:00';
  date: string;
  canCheckin: boolean;
  record: CheckinRecord | null;
};

export type CheckinResponse = {
  created: boolean;
  record: CheckinRecord;
};

export type CheckinHistory = {
  timezone: 'UTC+08:00';
  from: string;
  to: string;
  total: number;
  records: CheckinRecord[];
};
