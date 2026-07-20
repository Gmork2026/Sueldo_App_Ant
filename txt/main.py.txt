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
        
        # Histórico de Escalas UPSRA 2026 (Categoría: Vigilador General)
        self.historico_escalas = {
            "2026-01": EscalaSalarial(basico=867200, presentismo=165000, viaticos=473800, suma_no_rem=10000),
            "2026-02": EscalaSalarial(basico=876000, presentismo=165000, viaticos=473800, suma_no_rem=25000),
            "2026-03": EscalaSalarial(basico=884800, presentismo=165000, viaticos=473800, suma_no_rem=25000),
            "2026-04": EscalaSalarial(basico=893650, presentismo=165000, viaticos=480500, suma_no_rem=25000),
            "2026-05": EscalaSalarial(basico=902600, presentismo=165000, viaticos=487000, suma_no_rem=30000),
            "2026-06": EscalaSalarial(basico=911650, presentismo=165000, viaticos=498000, suma_no_rem=70000),
        }

    def obtener_escala(self, anio: int, mes: int) -> EscalaSalarial:
        clave = f"{anio}-{mes:02d}"
        # Si no encuentra el mes, devuelve la última escala conocida (junio 2026)
        return self.historico_escalas.get(clave, self.historico_escalas["2026-06"])

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

    def procesar_liquidacion(self, config: ConfiguracionMes) -> dict:
        base_requerida = self.obtener_base_mensual(config.anio, config.mes)
        proyeccion = self.proyectar_mes_ideal(config.anio, config.mes)
        escala_activa = self.obtener_escala(config.anio, config.mes)
        
        horas_extras = max(0.0, config.horas_reales - base_requerida)
        tiene_presentismo = config.horas_reales >= base_requerida
        
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
        
        # 1. Remunerativo (Se suma la antigüedad)
        total_remunerativo = escala_activa.basico + presentismo_pesos + total_extras_pesos + total_feriados_pesos + pago_antiguedad
        
        # 2. No Remunerativo
        total_no_remunerativo = escala_activa.viaticos + escala_activa.suma_no_rem
        
        # 3. Retenciones (17% de ley + cuota fija OS)
        retenciones_porcentaje = total_remunerativo * 0.17
        total_retenciones = retenciones_porcentaje + self.os_fija
        
        # 4. Neto
        neto_a_cobrar = (total_remunerativo + total_no_remunerativo) - total_retenciones
        
        return {
            "base_requerida": base_requerida,
            "feriados_trabajados": proyeccion["feriados_habiles"],
            "horas_extras": horas_extras,
            "presentismo": tiene_presentismo,
            "anios_antiguedad": anios_antiguedad,
            "pago_antiguedad": pago_antiguedad,
            # Data financiera
            "pesos_remunerativo": total_remunerativo,
            "pesos_no_rem": total_no_remunerativo,
            "pesos_retenciones": total_retenciones,
            "pesos_neto": neto_a_cobrar
        }

# ==========================================
# 3. CAPA DE PRESENTACIÓN (UI)
# ==========================================
def main(page: ft.Page):
    page.title = "Sistema de Control de Horas y Sueldo"
    page.window.width = 450
    page.window.height = 880
    page.theme_mode = ft.ThemeMode.DARK
    page.padding = 30
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
    page.scroll = ft.ScrollMode.AUTO  
    
    motor = MotorJornadaAutomatica()

    page.add(ft.Text("Calculadora Salarial", size=26, weight=ft.FontWeight.BOLD, color="blue400"))
    page.add(ft.Text("Escalas UPSRA + Antigüedad", size=14, color="white54"))
    page.add(ft.Divider(height=10, color="transparent"))

    in_fecha_ingreso = ft.TextField(
        label="Fecha de Ingreso (YYYY-MM-DD)",
        value="2025-06-05", 
        width=340,
        text_align=ft.TextAlign.CENTER
    )

    anio_dropdown = ft.Dropdown(
        label="Año",
        options=[ft.dropdown.Option(str(y)) for y in range(2024, 2030)],
        value=str(date.today().year),
        width=160
    )
    mes_dropdown = ft.Dropdown(
        label="Mes",
        options=[ft.dropdown.Option(str(m)) for m in range(1, 13)],
        value=str(date.today().month),
        width=160
    )
    
    horas_input = ft.TextField(
        label="Horas Totales del Mes", 
        keyboard_type=ft.KeyboardType.NUMBER,
        width=340,
        text_size=20,
        text_align=ft.TextAlign.CENTER
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

    def auto_completar_horas(e=None):
        anio = int(anio_dropdown.value)
        mes = int(mes_dropdown.value)
        proyeccion = motor.proyectar_mes_ideal(anio, mes)
        horas_input.value = str(proyeccion["horas_teoricas"])
        page.update()

    anio_dropdown.on_change = auto_completar_horas
    mes_dropdown.on_change = auto_completar_horas

    def calcular(e):
        try:
            fecha_ing_val = datetime.strptime(in_fecha_ingreso.value, "%Y-%m-%d").date()
            config = ConfiguracionMes(
                anio=int(anio_dropdown.value),
                mes=int(mes_dropdown.value),
                horas_reales=float(horas_input.value),
                fecha_ingreso=fecha_ing_val
            )
            
            res = motor.procesar_liquidacion(config)
            
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
                
            # Actualizar textos financieros con formato de moneda
            lbl_remunerativo.value = f"Remunerativo: ${res['pesos_remunerativo']:,.2f}"
            lbl_no_rem.value = f"No Remunerativo: ${res['pesos_no_rem']:,.2f}"
            lbl_descuentos.value = f"Retenciones: -${res['pesos_retenciones']:,.2f}"
            lbl_neto.value = f"NETO A COBRAR: ${res['pesos_neto']:,.2f}"
                
        except Exception as ex:
            page.snack_bar = ft.SnackBar(ft.Text("Revisa los datos ingresados (Formato fecha o número)."), bgcolor="red700")
            page.snack_bar.open = True
            
        page.update()

    btn_calcular = ft.FilledButton(
        "Calcular Liquidación", 
        on_click=calcular, 
        width=340, 
        height=50,
        style=ft.ButtonStyle(bgcolor="blue700", color="white")
    )

    # Tarjeta visual para los resultados financieros
    panel_financiero = ft.Container(
        content=ft.Column([
            ft.Text("Resumen Salarial", size=18, weight=ft.FontWeight.BOLD),
            ft.Divider(color="white24"),
            lbl_remunerativo,
            lbl_no_rem,
            lbl_descuentos,
            ft.Divider(color="white24"),
            lbl_neto
        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
        bgcolor=ft.Colors.with_opacity(0.05, "white"),
        padding=20,
        border_radius=10,
        width=340
    )

    page.add(
        in_fecha_ingreso,
        ft.Row([mes_dropdown, anio_dropdown], alignment=ft.MainAxisAlignment.CENTER),
        ft.Divider(height=10, color="transparent"),
        horas_input,
        ft.Divider(height=10, color="transparent"),
        btn_calcular,
        ft.Divider(height=20, color="white24"),
        lbl_extras,
        lbl_base,
        lbl_feriados,
        lbl_antiguedad,
        lbl_presentismo,
        ft.Divider(height=20, color="transparent"),
        panel_financiero
    )

    auto_completar_horas()

if __name__ == "__main__":
    puerto = int(os.environ.get("PORT", 8000))
    ft.app(target=main, view=ft.AppView.WEB_BROWSER, port=puerto, host="0.0.0.0")