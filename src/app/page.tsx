import { Container } from '@mantine/core';
import { ExchangeCard } from '@/components/Exchange/ExchangeCard';

export default function HomePage() {
  return (
    <Container py="xl" className="exchange-container">
      <ExchangeCard />
    </Container>
  );
}
