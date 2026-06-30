<?php

namespace Tests\Unit;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TenantScopeTest extends TestCase
{
    public function test_scope_adds_tenant_id_condition(): void
    {
        app()->instance('tenant_id', 5);

        $model = new class extends Model {
            protected $table = 'test_table';
        };

        $scope = new TenantScope;
        $builder = $model->newQuery();

        $scope->apply($builder, $model);

        $bindings = $builder->getBindings();
        $this->assertContains(5, $bindings);
    }

    public function test_scope_no_tenant_id(): void
    {
        app()->instance('tenant_id', null);

        $model = new class extends Model {
            protected $table = 'test_table';
        };

        $scope = new TenantScope;
        $builder = $model->newQuery();

        $scope->apply($builder, $model);

        $sql = $builder->toSql();
        $this->assertStringNotContainsString('tenant_id', $sql);
    }
}
