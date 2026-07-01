<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_configs', function (Blueprint $table) {
            $table->string('label')->nullable()->after('method');
        });

        // Corrige dados existentes: se method tem nome de exibição (ex: "Cartão de Crédito"),
        // move para label e restaura o identificador interno baseado no gateway
        DB::table('payment_configs')->eachById(function ($config) {
            if (preg_match('/[A-ZÇÃÕÉÓÍÂÊÔÚÁÀ\s]/u', $config->method) && !preg_match('/^[a-z_]+$/', $config->method)) {
                DB::table('payment_configs')->where('id', $config->id)->update([
                    'label' => $config->method,
                    'method' => $config->gateway,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('payment_configs', function (Blueprint $table) {
            $table->dropColumn('label');
        });
    }
};
