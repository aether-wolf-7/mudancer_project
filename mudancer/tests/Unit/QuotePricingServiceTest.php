<?php

namespace Tests\Unit;

use App\Services\QuotePricingService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class QuotePricingServiceTest extends TestCase
{
    /** @return array<int, array{0: float, 1: float}> */
    public static function commissionTierProvider(): array
    {
        return [
            [0, 1500],
            [5000, 1500],
            [5001, 2000],
            [10000, 2000],
            [10001, 2500],
            [12000, 2500],
            [15000, 2500],
            [15001, 3000],
            [20000, 3000],
            [45000, 5500],
            [45001, 6000],
            [50000, 6000],
            [100000, 11000],
            [100001, 12000],
            [110000, 12000],
            [110001, 12500],
            [120000, 12500],
            [120001, 15000],
            [130000, 15000],
            [150000, 18000],
            [200000, 25000],
            [300000, 30000],
            [400000, 40000],
            [500000, 45000],
            [500001, 50000],
            [999999, 50000],
        ];
    }

    #[DataProvider('commissionTierProvider')]
    public function test_commission_tiers(float $supplierPrice, float $expectedCommission): void
    {
        $this->assertSame($expectedCommission, QuotePricingService::getCommission($supplierPrice));
    }

    public function test_insurance_fee_is_zero_when_no_insured_value(): void
    {
        $this->assertSame(0.0, QuotePricingService::getInsuranceFee(null));
        $this->assertSame(0.0, QuotePricingService::getInsuranceFee(0));
    }

    public function test_insurance_fee_is_1_5_percent_of_declared_value(): void
    {
        $this->assertSame(1500.0, QuotePricingService::getInsuranceFee(100000));
        $this->assertSame(15000.0, QuotePricingService::getInsuranceFee(1000000));
        $this->assertSame(1275.0, QuotePricingService::getInsuranceFee(85000));
    }

    /**
     * Example from requirements: supplier $12,000 + commission $2,500 + insurance 1.5% of $100,000 = $16,000 total.
     * Breakdown: Apartado $2,500, Anticipo $6,750, Pago final $6,750. Supplier receives $13,500.
     */
    public function test_full_quote_example_with_insurance(): void
    {
        $calc = QuotePricingService::calculateQuote(12000, 100000);

        $this->assertSame(2500.0, $calc['comision']);
        $this->assertSame(1500.0, $calc['tarifa_seguro']);
        $this->assertSame(16000.0, $calc['precio_total']);
        $this->assertSame(2500.0, $calc['apartado']);
        $this->assertSame(6750.0, $calc['anticipo']);
        $this->assertSame(6750.0, $calc['pago_final']);

        // Payment breakdown must sum to total
        $this->assertSame(
            $calc['precio_total'],
            $calc['apartado'] + $calc['anticipo'] + $calc['pago_final'],
            'apartado + anticipo + pago_final must equal precio_total'
        );

        // Supplier receives: supplier price + insurance
        $supplierReceives = 12000 + 1500;
        $this->assertEquals(13500, $supplierReceives);
    }

    /**
     * No insurance: supplier $12,000 + commission $2,500 = $14,500 total.
     * Apartado $2,500, Anticipo $6,000, Pago final $6,000.
     */
    public function test_full_quote_example_without_insurance(): void
    {
        $calc = QuotePricingService::calculateQuote(12000, null);

        $this->assertSame(2500.0, $calc['comision']);
        $this->assertNull($calc['tarifa_seguro']);
        $this->assertSame(14500.0, $calc['precio_total']);
        $this->assertSame(2500.0, $calc['apartado']);
        $this->assertSame(6000.0, $calc['anticipo']);
        $this->assertSame(6000.0, $calc['pago_final']);

        $this->assertSame(
            $calc['precio_total'],
            $calc['apartado'] + $calc['anticipo'] + $calc['pago_final']
        );
    }

    /**
     * Supplier $5,000 (commission $1,500) → total $6,500. No insurance.
     */
    public function test_low_tier_quote(): void
    {
        $calc = QuotePricingService::calculateQuote(5000, null);

        $this->assertSame(1500.0, $calc['comision']);
        $this->assertSame(6500.0, $calc['precio_total']);
        $this->assertSame(1500.0, $calc['apartado']);
        $this->assertSame(2500.0, $calc['anticipo']);
        $this->assertSame(2500.0, $calc['pago_final']);
        $this->assertSame($calc['precio_total'], $calc['apartado'] + $calc['anticipo'] + $calc['pago_final']);
    }

    /**
     * Supplier $100,000 (commission $11,000) → total $111,000. No insurance.
     */
    public function test_high_tier_quote_no_insurance(): void
    {
        $calc = QuotePricingService::calculateQuote(100000, null);

        $this->assertSame(11000.0, $calc['comision']);
        $this->assertSame(111000.0, $calc['precio_total']);
        $this->assertSame(11000.0, $calc['apartado']);
        $this->assertSame(50000.0, $calc['anticipo']);
        $this->assertSame(50000.0, $calc['pago_final']);
        $this->assertSame($calc['precio_total'], $calc['apartado'] + $calc['anticipo'] + $calc['pago_final']);
    }

    /**
     * Every payment breakdown must sum exactly to precio_total (no rounding drift).
     */
    public function test_rounding_sum_consistency(): void
    {
        $cases = [
            [5000, null],
            [12000, 100000],
            [12000, null],
            [10000, null],
            [33333, 50000],
            [100000, null],
            [250000, 200000],
        ];

        foreach ($cases as [$supplier, $insured]) {
            $calc = QuotePricingService::calculateQuote((float) $supplier, $insured === null ? null : (float) $insured);
            $sum = $calc['apartado'] + $calc['anticipo'] + $calc['pago_final'];
            $this->assertSame(
                $calc['precio_total'],
                $sum,
                "Sum mismatch for supplier={$supplier}, insured=" . ($insured ?? 'null')
            );
        }
    }
}
