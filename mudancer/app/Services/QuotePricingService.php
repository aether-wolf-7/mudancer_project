<?php

namespace App\Services;

class QuotePricingService
{
    /**
     * Commission table: fee to add on top of supplier price (by tier).
     */
    public static function getCommission(float $supplierPrice): float
    {
        if ($supplierPrice <= 5000)   return 1500;
        if ($supplierPrice <= 10000)  return 2000;
        if ($supplierPrice <= 15000)  return 2500;
        if ($supplierPrice <= 20000)  return 3000;
        if ($supplierPrice <= 25000)  return 3500;
        if ($supplierPrice <= 30000)  return 4000;
        if ($supplierPrice <= 35000)  return 4500;
        if ($supplierPrice <= 40000)  return 5000;
        if ($supplierPrice <= 45000)  return 5500;
        if ($supplierPrice <= 50000)  return 6000;
        if ($supplierPrice <= 55000)  return 6500;
        if ($supplierPrice <= 60000)  return 7000;
        if ($supplierPrice <= 65000)  return 7500;
        if ($supplierPrice <= 70000)  return 8000;
        if ($supplierPrice <= 75000)  return 8500;
        if ($supplierPrice <= 80000)  return 9000;
        if ($supplierPrice <= 85000)  return 9500;
        if ($supplierPrice <= 90000)  return 10000;
        if ($supplierPrice <= 95000)  return 10500;
        if ($supplierPrice <= 100000) return 11000;
        if ($supplierPrice <= 110000) return 12000;
        if ($supplierPrice <= 120000) return 12500;
        if ($supplierPrice <= 130000) return 15000;
        if ($supplierPrice <= 150000) return 18000;
        if ($supplierPrice <= 200000) return 25000;
        if ($supplierPrice <= 300000) return 30000;
        if ($supplierPrice <= 400000) return 40000;
        if ($supplierPrice <= 500000) return 45000;
        return 50000;
    }

    /**
     * Insurance fee: 1.5% of declared insured value.
     */
    public static function getInsuranceFee(?float $insuredValue): float
    {
        if ($insuredValue === null || $insuredValue <= 0) {
            return 0.0;
        }
        return round((float) $insuredValue * 0.015, 2);
    }

    /**
     * Full quote calculation: supplier price + commission + insurance → total and payment breakdown.
     * Returns: comision, tarifa_seguro, precio_total, apartado, anticipo, pago_final
     */
    public static function calculateQuote(float $supplierPrice, ?float $insuredValue = null): array
    {
        $comision      = self::getCommission($supplierPrice);
        $tarifaSeguro  = self::getInsuranceFee($insuredValue);
        $seguroAmt     = $tarifaSeguro;

        $precioTotal = round($supplierPrice + $comision + $seguroAmt, 2);
        $apartado    = round($comision, 2);
        $mitad       = round(($supplierPrice + $seguroAmt) / 2, 2);
        $anticipo    = $mitad;
        $pagoFinal   = round($precioTotal - $apartado - $mitad, 2);

        return [
            'comision'      => round($comision, 2),
            'tarifa_seguro' => $insuredValue > 0 ? round($tarifaSeguro, 2) : null,
            'precio_total'  => $precioTotal,
            'apartado'      => $apartado,
            'anticipo'      => $anticipo,
            'pago_final'    => $pagoFinal,
        ];
    }
}
