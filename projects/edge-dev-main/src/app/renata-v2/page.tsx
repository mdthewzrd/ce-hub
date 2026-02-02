import RenataV2Transformer from '@/components/renata/RenataV2Transformer';

export default function RenataV2Page() {
  return (
    <div className="min-h-screen bg-background">
      <RenataV2Transformer />
    </div>
  );
}

export const metadata = {
  title: 'RENATA_V2 Transformer',
  description: 'Transform any trading scanner code into EdgeDev v31 standard',
};
