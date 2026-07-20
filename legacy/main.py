import flet as ft
from datetime import date, datetime
import calendar
import holidays
from pydantic import BaseModel, Field
import os

# ==========================================
# 1. CAPA DE DATOS
# ==========================================
class ConfiguracionMes(BaseModel):
    anio: int = Field(..., ge=2024, le=2030)
    mes: int = Field(..., ge=1, le=12)
    horas_reales: float = Field(..., ge=0, description="Total de horas realmente trabajadas")
    fecha_ingreso: date = Field(..., description="Fecha de ingreso para cálculo de antigüedad")
    dias_vacaciones: int = Field(default=0, ge=0, le=14, description="Días de vacaciones a tomar (0, 7 o 14)")

class EscalaSalarial(BaseModel):
    basico: float
    presentismo: float
    viaticos: float
    suma_no_rem: float

# ==========================================
# 2. CAPA DE NEGOCIO (Motor + Finanzas)
# ==========================================
class MotorJornadaAutomatica:
    def __init__(self):
        self.feriados_arg = holidays.country_holidays('AR')
        self.os_fija = 750.00
        
        self.historico_escalas = {
            "Vigilador General": {
                "2026-01": EscalaSalarial(basico=867200, presentismo=165000, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=876000, presentismo=165000, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=884800, presentismo=165000, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=893650, presentismo=165000, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=902600, presentismo=165000, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=911650, presentismo=165000, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1001300, presentismo=180000, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1020300, presentismo=180000, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1037600, presentismo=180000, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1053200, presentismo=180000, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1069000, presentismo=180000, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1085000, presentismo=180000, viaticos=545000, suma_no_rem=120000),
            },
            "Vigilador Bombero": {
                "2026-01": EscalaSalarial(basico=923700, presentismo=178900, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=933600, presentismo=178900, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=942900, presentismo=178900, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=952400, presentismo=178900, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=962300, presentismo=178900, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=974100, presentismo=178900, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1065500, presentismo=195100, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1086200, presentismo=195100, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1105700, presentismo=195100, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1123000, presentismo=195100, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1140500, presentismo=195100, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1159500, presentismo=195100, viaticos=545000, suma_no_rem=120000),
            },
            "Administrativo": {
                "2026-01": EscalaSalarial(basico=949700, presentismo=186100, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=960200, presentismo=186100, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=969700, presentismo=186100, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=979500, presentismo=186100, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=989800, presentismo=186100, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=1003000, presentismo=186100, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1095000, presentismo=203000, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1116600, presentismo=203000, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1137100, presentismo=203000, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1155100, presentismo=203000, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1173400, presentismo=203000, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1194000, presentismo=203000, viaticos=545000, suma_no_rem=120000),
            },
            "Vigilador Principal": {
                "2026-01": EscalaSalarial(basico=978900, presentismo=193100, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=989900, presentismo=193100, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=999800, presentismo=193100, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=1010300, presentismo=193100, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=1020600, presentismo=193100, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=1035200, presentismo=193100, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1128000, presentismo=210700, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1150500, presentismo=210700, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1172100, presentismo=210700, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1191000, presentismo=210700, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1210200, presentismo=210700, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1232300, presentismo=210700, viaticos=545000, suma_no_rem=120000),
            },
            "Verificación de Eventos": {
                "2026-01": EscalaSalarial(basico=923700, presentismo=178900, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=933600, presentismo=178900, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=942900, presentismo=178900, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=952400, presentismo=178900, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=962300, presentismo=178900, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=974100, presentismo=178900, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1065500, presentismo=195100, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1086200, presentismo=195100, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1105700, presentismo=195100, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1123000, presentismo=195100, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1140500, presentismo=195100, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1159500, presentismo=195100, viaticos=545000, suma_no_rem=120000),
            },
            "Operador de Monitoreo": {
                "2026-01": EscalaSalarial(basico=923700, presentismo=178900, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=933600, presentismo=178900, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=942900, presentismo=178900, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=952400, presentismo=178900, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=962300, presentismo=178900, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=974100, presentismo=178900, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1065500, presentismo=195100, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1086200, presentismo=195100, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1105700, presentismo=195100, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1123000, presentismo=195100, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1140500, presentismo=195100, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1159500, presentismo=195100, viaticos=545000, suma_no_rem=120000),
            },
            "Guía Técnico": {
                "2026-01": EscalaSalarial(basico=949700, presentismo=186100, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=960200, presentismo=186100, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=969700, presentismo=186100, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=979500, presentismo=186100, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=989800, presentismo=186100, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=1003000, presentismo=186100, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1095000, presentismo=203000, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1116600, presentismo=203000, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1137100, presentismo=203000, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1155100, presentismo=203000, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1173400, presentismo=203000, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1193900, presentismo=203000, viaticos=545000, suma_no_rem=120000),
            },
            "Instalador Sist. Electrónicos": {
                "2026-01": EscalaSalarial(basico=978900, presentismo=193100, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=989900, presentismo=193100, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=999800, presentismo=193100, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=1010300, presentismo=193100, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=1020600, presentismo=193100, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=1035200, presentismo=193100, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1128000, presentismo=210700, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1150500, presentismo=210700, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1172100, presentismo=210700, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1191000, presentismo=210700, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1210200, presentismo=210700, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1232300, presentismo=210700, viaticos=545000, suma_no_rem=120000),
            },
            "Controlador de Admisión y Permanencia General": {
                "2026-01": EscalaSalarial(basico=867200, presentismo=165000, viaticos=473800, suma_no_rem=10000),
                "2026-02": EscalaSalarial(basico=876000, presentismo=165000, viaticos=473800, suma_no_rem=25000),
                "2026-03": EscalaSalarial(basico=884800, presentismo=165000, viaticos=473800, suma_no_rem=25000),
                "2026-04": EscalaSalarial(basico=893650, presentismo=165000, viaticos=480500, suma_no_rem=25000),
                "2026-05": EscalaSalarial(basico=902600, presentismo=165000, viaticos=487000, suma_no_rem=30000),
                "2026-06": EscalaSalarial(basico=911650, presentismo=165000, viaticos=498000, suma_no_rem=70000),
                "2026-07": EscalaSalarial(basico=1001300, presentismo=180000, viaticos=505500, suma_no_rem=20000),
                "2026-08": EscalaSalarial(basico=1020300, presentismo=180000, viaticos=514500, suma_no_rem=30000),
                "2026-09": EscalaSalarial(basico=1037600, presentismo=180000, viaticos=524000, suma_no_rem=50000),
                "2026-10": EscalaSalarial(basico=1053200, presentismo=180000, viaticos=534000, suma_no_rem=60000),
                "2026-11": EscalaSalarial(basico=1069000, presentismo=180000, viaticos=545000, suma_no_rem=70000),
                "2026-12": EscalaSalarial(basico=1085000, presentismo=180000, viaticos=545000, suma_no_rem=120000),
            },
        }

    def obtener_escala(self, categoria: str, anio: int, mes: int) -> EscalaSalarial:
        clave = f"{anio}-{mes:02d}"
        escalas_cat = self.historico_escalas.get(categoria, self.historico_escalas["Vigilador General"])
        return escalas_cat.get(clave, escalas_cat["2026-06"])

    def calcular_antiguedad(self, fecha_ingreso: date, anio_liq: int, mes_liq: int) -> int:
        fecha_liq = date(anio_liq, mes_liq, 1)
        anios = fecha_liq.year - fecha_ingreso.year
        if (fecha_liq.month, fecha_liq.day) < (fecha_ingreso.month, fecha_ingreso.day):
            anios -= 1
        return max(0, anios)

    def obtener_base_mensual(self, anio: int, mes: int) -> int:
        _, dias_en_mes = calendar.monthrange(anio, mes)
        if dias_en_mes == 31: return 216
        elif dias_en_mes == 30: return 208
        else: return 192

    def proyectar_mes_ideal(self, anio: int, mes: int) -> dict:
        _, dias_en_mes = calendar.monthrange(anio, mes)
        total_horas_ideal = 0
        feriados_l_v = 0
        
        for dia in range(1, dias_en_mes + 1):
            fecha_actual = date(anio, mes, dia)
            es_feriado = fecha_actual in self.feriados_arg
            es_dia_habil = fecha_actual.weekday() < 5
            
            if es_dia_habil:
                if es_feriado:
                    total_horas_ideal += 8
                    feriados_l_v += 1
                else:
                    total_horas_ideal += 11
                    
        return {
            "horas_teoricas": total_horas_ideal,
            "feriados_habiles": feriados_l_v
        }

    def _calcular_sac(self, categoria: str, anio: int, mes: int, fecha_ingreso: date) -> float:
        semestre = 1 if mes == 6 else 2
        meses_semestre = range(1, 7) if semestre == 1 else range(7, 13)
        mayor_remunerativo = 0.0

        for m in meses_semestre:
            clave = f"{anio}-{m:02d}"
            escalas_cat = self.historico_escalas.get(categoria, self.historico_escalas["Vigilador General"])
            escala = escalas_cat.get(clave)
            if not escala:
                continue

            base_m = self.obtener_base_mensual(anio, m)
            _, dias_en_m = calendar.monthrange(anio, m)
            proyeccion_m = self.proyectar_mes_ideal(anio, m)

            anios_ant = self.calcular_antiguedad(fecha_ingreso, anio, m)
            pago_ant = (escala.basico * 0.01) * anios_ant

            valor_hora = (escala.basico + escala.presentismo + pago_ant) / 200
            valor_feriado = escala.basico / 25

            total_extras_m = (proyeccion_m["horas_teoricas"] - base_m) * valor_hora * 1.5
            total_feriados_m = proyeccion_m["feriados_habiles"] * valor_feriado

            remunerativo_m = escala.basico + escala.presentismo + pago_ant + max(0, total_extras_m) + total_feriados_m
            if remunerativo_m > mayor_remunerativo:
                mayor_remunerativo = remunerativo_m

        return mayor_remunerativo * 0.5

    def _calcular_sac(self, categoria: str, anio: int, mes: int, fecha_ingreso: date) -> dict:
        semestre = 1 if mes == 6 else 2
        meses_semestre = range(1, 7) if semestre == 1 else range(7, 13)
        mayor_remunerativo = 0.0

        for m in meses_semestre:
            clave = f"{anio}-{m:02d}"
            escalas_cat = self.historico_escalas.get(categoria, self.historico_escalas["Vigilador General"])
            escala = escalas_cat.get(clave)
            if not escala:
                continue

            base_m = self.obtener_base_mensual(anio, m)
            _, dias_en_m = calendar.monthrange(anio, m)
            proyeccion_m = self.proyectar_mes_ideal(anio, m)

            anios_ant = self.calcular_antiguedad(fecha_ingreso, anio, m)
            pago_ant = (escala.basico * 0.01) * anios_ant

            valor_hora = (escala.basico + escala.presentismo + pago_ant) / 200
            valor_feriado = escala.basico / 25

            total_extras_m = (proyeccion_m["horas_teoricas"] - base_m) * valor_hora * 1.5
            total_feriados_m = proyeccion_m["feriados_habiles"] * valor_feriado

            remunerativo_m = escala.basico + escala.presentismo + pago_ant + max(0, total_extras_m) + total_feriados_m
            if remunerativo_m > mayor_remunerativo:
                mayor_remunerativo = remunerativo_m

        sac_bruto = mayor_remunerativo * 0.5
        desc_sac = sac_bruto * 0.17
        sac_neto = sac_bruto - desc_sac

        return {
            "bruto": sac_bruto,
            "descuento": desc_sac,
            "neto": sac_neto
        }

    def procesar_liquidacion(self, config: ConfiguracionMes, categoria: str) -> dict:
        _, dias_en_mes = calendar.monthrange(config.anio, config.mes)
        base_requerida = self.obtener_base_mensual(config.anio, config.mes)
        proyeccion = self.proyectar_mes_ideal(config.anio, config.mes)
        escala_activa = self.obtener_escala(categoria, config.anio, config.mes)
        
        # --- CÁLCULO DE VACACIONES ---
        dias_vacaciones = config.dias_vacaciones
        if dias_vacaciones > 0:
            dias_trabajados = dias_en_mes - dias_vacaciones
            pago_basico_trabajado = (escala_activa.basico / 30) * dias_trabajados
            pago_vacaciones = (escala_activa.basico / 25) * dias_vacaciones
            total_basico = pago_basico_trabajado + pago_vacaciones
            plus_vacacional = total_basico - escala_activa.basico
        else:
            dias_trabajados = dias_en_mes
            pago_basico_trabajado = escala_activa.basico
            pago_vacaciones = 0.0
            total_basico = escala_activa.basico
            plus_vacacional = 0.0
        
        horas_extras = max(0.0, config.horas_reales - base_requerida)
        # Con vacaciones, la empresa considera esos días como trabajo efectivo
        tiene_presentismo = config.horas_reales >= base_requerida or dias_vacaciones > 0
        
        # --- CÁLCULO DE ANTIGÜEDAD ---
        anios_antiguedad = self.calcular_antiguedad(config.fecha_ingreso, config.anio, config.mes)
        pago_antiguedad = (escala_activa.basico * 0.01) * anios_antiguedad # 1% del básico por año
        
        # --- CÁLCULO FINANCIERO DINÁMICO ---
        valor_hora_normal = (escala_activa.basico + escala_activa.presentismo + pago_antiguedad) / 200
        valor_hora_extra = valor_hora_normal * 1.5
        valor_dia_feriado = escala_activa.basico / 25
        
        total_extras_pesos = horas_extras * valor_hora_extra
        total_feriados_pesos = proyeccion["feriados_habiles"] * valor_dia_feriado
        presentismo_pesos = escala_activa.presentismo if tiene_presentismo else 0.0
        
        # 1. Remunerativo (Se suma la antigüedad y vacaciones si corresponde)
        total_remunerativo = total_basico + presentismo_pesos + total_extras_pesos + total_feriados_pesos + pago_antiguedad
        
        # 2. No Remunerativo
        total_no_remunerativo = escala_activa.viaticos + escala_activa.suma_no_rem
        
        # 3. Retenciones (17% de ley + cuota fija OS)
        retenciones_porcentaje = total_remunerativo * 0.17
        total_retenciones = retenciones_porcentaje + self.os_fija
        
        # 4. Neto
        neto_a_cobrar = (total_remunerativo + total_no_remunerativo) - total_retenciones

        # 5. SUELDO ANUAL COMPLEMENTARIO (SAC / Aguinaldo)
        sac_bruto = 0.0
        sac_descuento = 0.0
        sac_neto = 0.0
        if config.mes == 6 or config.mes == 12:
            sac_data = self._calcular_sac(categoria, config.anio, config.mes, config.fecha_ingreso)
            sac_bruto = sac_data["bruto"]
            sac_descuento = sac_data["descuento"]
            sac_neto = sac_data["neto"]

        return {
            "base_requerida": base_requerida,
            "feriados_trabajados": proyeccion["feriados_habiles"],
            "horas_extras": horas_extras,
            "presentismo": tiene_presentismo,
            "anios_antiguedad": anios_antiguedad,
            "pago_antiguedad": pago_antiguedad,
            # Data vacaciones
            "dias_vacaciones": dias_vacaciones,
            "dias_trabajados": dias_trabajados,
            "pago_basico_trabajado": pago_basico_trabajado,
            "pago_vacaciones": pago_vacaciones,
            "plus_vacacional": plus_vacacional,
            # Data financiera
            "pesos_remunerativo": total_remunerativo,
            "pesos_no_rem": total_no_remunerativo,
            "pesos_retenciones": total_retenciones,
            "pesos_neto": neto_a_cobrar,
            "sac_bruto": sac_bruto,
            "sac_descuento": sac_descuento,
            "sac_neto": sac_neto
        }

# ==========================================
# 3. CAPA DE PRESENTACIÓN (UI)
# ==========================================
def main(page: ft.Page):
    page.title = "Sistema de Control de Horas y Sueldo"
    page.theme_mode = ft.ThemeMode.DARK
    page.padding = 20
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
    page.scroll = ft.ScrollMode.AUTO  
    
    motor = MotorJornadaAutomatica()

    page.add(ft.Text("Calculadora Salarial", size=26, weight=ft.FontWeight.BOLD, color="blue400"))
    page.add(ft.Text("Escalas UPSRA + Antigüedad", size=14, color="white54"))
    page.add(ft.Divider(height=10, color="transparent"))

    categoria_dropdown = ft.Dropdown(
        label="Categoría",
        options=[ft.dropdown.Option(c) for c in motor.historico_escalas.keys()],
        value="Vigilador General",
        expand=True
    )

    in_fecha_ingreso = ft.TextField(
        label="Fecha de Ingreso (YYYY-MM-DD)",
        value="2025-06-05", 
        expand=True,
        text_align=ft.TextAlign.CENTER
    )

    anio_dropdown = ft.Dropdown(
        label="Año",
        options=[ft.dropdown.Option(str(y)) for y in range(2024, 2030)],
        value=str(date.today().year),
        expand=True
    )
    mes_dropdown = ft.Dropdown(
        label="Mes",
        options=[ft.dropdown.Option(str(m)) for m in range(1, 13)],
        value=str(date.today().month),
        expand=True
    )
    
    horas_input = ft.TextField(
        label="Horas Totales del Mes", 
        keyboard_type=ft.KeyboardType.NUMBER,
        expand=True,
        text_size=20,
        text_align=ft.TextAlign.CENTER
    )

    vacaciones_dropdown = ft.Dropdown(
        label="Días de Vacaciones",
        options=[
            ft.dropdown.Option("0"),
            ft.dropdown.Option("7"),
            ft.dropdown.Option("14")
        ],
        value="0",
        expand=True
    )

    # Elementos de Horas
    lbl_base = ft.Text("Base: --", size=14)
    lbl_extras = ft.Text("Extras: --", size=18, weight=ft.FontWeight.BOLD, color="orange")
    lbl_feriados = ft.Text("Feriados: --", size=14)
    lbl_presentismo = ft.Text("Presentismo: --", size=14)
    lbl_antiguedad = ft.Text("Antigüedad: --", size=14, color="cyan")

    # Elementos Financieros
    lbl_remunerativo = ft.Text("Remunerativo: $0.00", size=14, color="white70")
    lbl_no_rem = ft.Text("No Remunerativo: $0.00", size=14, color="white70")
    lbl_descuentos = ft.Text("Retenciones: $0.00", size=14, color="red400")
    lbl_neto = ft.Text("NETO A COBRAR: $0.00", size=24, weight=ft.FontWeight.BOLD, color="green400")
    
    # Elementos de Vacaciones
    lbl_vacaciones = ft.Text("", size=14, color="yellow")

    # Elementos de Aguinaldo (SAC)
    lbl_sac_bruto = ft.Text("", size=13, color="amber200")
    lbl_sac_desc = ft.Text("", size=13, color="red300")
    lbl_sac_neto = ft.Text("", size=15, weight=ft.FontWeight.BOLD, color="amber400")

    def auto_completar_horas(e=None):
        anio = int(anio_dropdown.value)
        mes = int(mes_dropdown.value)
        dias_vac = int(vacaciones_dropdown.value)
        _, dias_en_mes = calendar.monthrange(anio, mes)
        proyeccion = motor.proyectar_mes_ideal(anio, mes)
        
        if dias_vac > 0:
            dias_trabajados = dias_en_mes - dias_vac
            factor = dias_trabajados / dias_en_mes
            horas_ajustadas = int(proyeccion["horas_teoricas"] * factor)
            horas_input.value = str(horas_ajustadas)
        else:
            horas_input.value = str(proyeccion["horas_teoricas"])
        page.update()

    anio_dropdown.on_change = auto_completar_horas
    mes_dropdown.on_change = auto_completar_horas
    vacaciones_dropdown.on_change = auto_completar_horas

    def calcular(e):
        try:
            fecha_ing_val = datetime.strptime(in_fecha_ingreso.value, "%Y-%m-%d").date()
            config = ConfiguracionMes(
                anio=int(anio_dropdown.value),
                mes=int(mes_dropdown.value),
                horas_reales=float(horas_input.value),
                fecha_ingreso=fecha_ing_val,
                dias_vacaciones=int(vacaciones_dropdown.value)
            )
            
            res = motor.procesar_liquidacion(config, categoria_dropdown.value)
            
            lbl_categoria.value = f"Categoría: {categoria_dropdown.value}"
            
            # Actualizar textos de horas
            lbl_base.value = f"Base exigida: {res['base_requerida']} hs"
            lbl_extras.value = f"Horas Extras: {res['horas_extras']} hs"
            lbl_feriados.value = f"Feriados (L a V): {res['feriados_trabajados']} días"
            lbl_antiguedad.value = f"Antigüedad: {res['anios_antiguedad']} años (+${res['pago_antiguedad']:,.2f})"
            
            if res['presentismo']:
                lbl_presentismo.value = "Presentismo: ALCANZADO ✅"
                lbl_presentismo.color = "green"
            else:
                lbl_presentismo.value = "Presentismo: PERDIDO ❌"
                lbl_presentismo.color = "red"
            
            # Mostrar desglose de vacaciones
            if res['dias_vacaciones'] > 0:
                lbl_vacaciones.value = (
                    f"Vacaciones: {res['dias_vacaciones']} días\n"
                    f"  Trabajados: {res['dias_trabajados']} días (${res['pago_basico_trabajado']:,.2f})\n"
                    f"  Vacaciones: ${res['pago_vacaciones']:,.2f}\n"
                    f"  Plus vacacional: +${res['plus_vacacional']:,.2f}"
                )
                lbl_vacaciones.color = "yellow"
            else:
                lbl_vacaciones.value = ""
                
            # Actualizar textos financieros con formato de moneda
            lbl_remunerativo.value = f"Remunerativo: ${res['pesos_remunerativo']:,.2f}"
            lbl_no_rem.value = f"No Remunerativo: ${res['pesos_no_rem']:,.2f}"
            lbl_descuentos.value = f"Retenciones: -${res['pesos_retenciones']:,.2f}"
            lbl_neto.value = f"NETO A COBRAR: ${res['pesos_neto']:,.2f}"

            if res['sac_bruto'] > 0:
                sem_text = "1° semestre (Jun)" if int(mes_dropdown.value) == 6 else "2° semestre (Dic)"
                lbl_sac_bruto.value = f"SAC Bruto - {sem_text}: ${res['sac_bruto']:,.2f}"
                lbl_sac_desc.value = f"  Desc. 17% cargas sociales: -${res['sac_descuento']:,.2f}"
                lbl_sac_neto.value = f"SAC NETO A COBRAR: ${res['sac_neto']:,.2f}"
            else:
                lbl_sac_bruto.value = ""
                lbl_sac_desc.value = ""
                lbl_sac_neto.value = ""
                
        except Exception as ex:
            page.snack_bar = ft.SnackBar(ft.Text("Revisa los datos ingresados (Formato fecha o número)."), bgcolor="red700")
            page.snack_bar.open = True
            
        page.update()

    btn_calcular = ft.FilledButton(
        "Calcular Liquidación", 
        on_click=calcular, 
        expand=True,
        height=50,
        style=ft.ButtonStyle(bgcolor="blue700", color="white")
    )

    # Tarjeta visual para los resultados financieros
    lbl_categoria = ft.Text("Vigilador General", size=13, color="blue300")
    panel_financiero = ft.Container(
        content=ft.Column([
            ft.Text("Resumen Salarial", size=18, weight=ft.FontWeight.BOLD),
            lbl_categoria,
            ft.Divider(color="white24"),
            lbl_remunerativo,
            lbl_no_rem,
            lbl_descuentos,
            ft.Divider(color="white24"),
            lbl_neto,
            lbl_sac_bruto,
            lbl_sac_desc,
            lbl_sac_neto
        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
        bgcolor=ft.Colors.with_opacity(0.05, "white"),
        padding=20,
        border_radius=10,
        expand=True
    )

    page.add(
        categoria_dropdown,
        ft.Divider(height=5, color="transparent"),
        in_fecha_ingreso,
        ft.Row([mes_dropdown, anio_dropdown], expand=True),
        ft.Divider(height=5, color="transparent"),
        horas_input,
        vacaciones_dropdown,
        ft.Divider(height=10, color="transparent"),
        btn_calcular,
        ft.Divider(height=20, color="white24"),
        lbl_extras,
        lbl_base,
        lbl_feriados,
        lbl_antiguedad,
        lbl_presentismo,
        lbl_vacaciones,
        ft.Divider(height=20, color="transparent"),
        panel_financiero
    )

    auto_completar_horas()

if __name__ == "__main__":
    puerto = int(os.environ.get("PORT", 8000))
    ft.run(main=main, view=ft.AppView.WEB_BROWSER, port=puerto, host="0.0.0.0")