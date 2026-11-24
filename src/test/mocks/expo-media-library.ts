export type FakeMediaAsset = {
  getInfo: () => Promise<{
    id: string;
    uri: string;
    filename: string;
    duration: number;
    creationTime: number;
    modificationTime: number;
  }>;
};

export const mockMediaState: { assets: FakeMediaAsset[] } = { assets: [] };

export class Query {
  private limitValue = 50;
  private offsetValue = 0;

  eq() {
    return this;
  }

  gte() {
    return this;
  }

  orderBy() {
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  offset(value: number) {
    this.offsetValue = value;
    return this;
  }

  async exe() {
    return mockMediaState.assets.slice(this.offsetValue, this.offsetValue + this.limitValue);
  }
}

export const AssetField = {
  MEDIA_TYPE: 'mediaType',
  DURATION: 'duration',
  CREATION_TIME: 'creationTime',
};

export const MediaType = { AUDIO: 'audio' };
