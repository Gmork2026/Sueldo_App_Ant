from datetime import date, datetime
import calendar
import holidays


class SalaryEngine:
    CATEGORIES = [
        "Vigilador General",
        "Vigilador Bombero",
        "Administrativo",
        "Vigilador Principal",
        "Verificación de Eventos",
        "Operador de Monitoreo",
        "Guía Técnico",
        "Instalador Sist. Electrónicos",
        "Controlador de Admisión y Permanencia General",
    ]

    def __init__(self):
        self.feriados_arg = holidays.country_holidays("AR")
        self.os_fija = 750.00
        self._init_scales()

    def _init_scales(self):
        self.escalas = {
            "Vigilador General": {
                "2026-01": {"basico": 867200, "presentismo": 165000, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 876000, "presentismo": 165000, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 884800, "presentismo": 165000, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 893650, "presentismo": 165000, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 902600, "presentismo": 165000, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 911650, "presentismo": 165000, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1001300, "presentismo": 180000, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1020300, "presentismo": 180000, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1037600, "presentismo": 180000, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1053200, "presentismo": 180000, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1069000, "presentismo": 180000, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1085000, "presentismo": 180000, "viaticos": 545000, "suma_no_rem": 120000},
            },
            "Vigilador Bombero": {
                "2026-01": {"basico": 923700, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 933600, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 942900, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 952400, "presentismo": 178900, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 962300, "presentismo": 178900, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 974100, "presentismo": 178900, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1065500, "presentismo": 195100, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1086200, "presentismo": 195100, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1105700, "presentismo": 195100, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1123000, "presentismo": 195100, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1140500, "presentismo": 195100, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1159500, "presentismo": 195100, "viaticos": 545000, "suma_no_rem": 120000},
            },
            "Administrativo": {
                "2026-01": {"basico": 949700, "presentismo": 186100, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 960200, "presentismo": 186100, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 969700, "presentismo": 186100, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 979500, "presentismo": 186100, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 989800, "presentismo": 186100, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 1003000, "presentismo": 186100, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1095000, "presentismo": 203000, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1116600, "presentismo": 203000, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1137100, "presentismo": 203000, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1155100, "presentismo": 203000, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1173400, "presentismo": 203000, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1194000, "presentismo": 203000, "viaticos": 545000, "suma_no_rem": 120000},
            },
            "Vigilador Principal": {
                "2026-01": {"basico": 978900, "presentismo": 193100, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 989900, "presentismo": 193100, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 999800, "presentismo": 193100, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 1010300, "presentismo": 193100, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 1020600, "presentismo": 193100, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 1035200, "presentismo": 193100, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1128000, "presentismo": 210700, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1150500, "presentismo": 210700, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1172100, "presentismo": 210700, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1191000, "presentismo": 210700, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1210200, "presentismo": 210700, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1232300, "presentismo": 210700, "viaticos": 545000, "suma_no_rem": 120000},
            },
            "Verificación de Eventos": {
                "2026-01": {"basico": 923700, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 933600, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 942900, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 952400, "presentismo": 178900, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 962300, "presentismo": 178900, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 974100, "presentismo": 178900, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1065500, "presentismo": 195100, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1086200, "presentismo": 195100, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1105700, "presentismo": 195100, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1123000, "presentismo": 195100, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1140500, "presentismo": 195100, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1159500, "presentismo": 195100, "viaticos": 545000, "suma_no_rem": 120000},
            },
            "Operador de Monitoreo": {
                "2026-01": {"basico": 923700, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 933600, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 942900, "presentismo": 178900, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 952400, "presentismo": 178900, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 962300, "presentismo": 178900, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 974100, "presentismo": 178900, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1065500, "presentismo": 195100, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1086200, "presentismo": 195100, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1105700, "presentismo": 195100, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1123000, "presentismo": 195100, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1140500, "presentismo": 195100, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1159500, "presentismo": 195100, "viaticos": 545000, "suma_no_rem": 120000},
            },
            "Guía Técnico": {
                "2026-01": {"basico": 949700, "presentismo": 186100, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 960200, "presentismo": 186100, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 969700, "presentismo": 186100, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 979500, "presentismo": 186100, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 989800, "presentismo": 186100, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 1003000, "presentismo": 186100, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1095000, "presentismo": 203000, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1116600, "presentismo": 203000, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1137100, "presentismo": 203000, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1155100, "presentismo": 203000, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1173400, "presentismo": 203000, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1193900, "presentismo": 203000, "viaticos": 545000, "suma_no_rem": 120000},
            },
            "Instalador Sist. Electrónicos": {
                "2026-01": {"basico": 978900, "presentismo": 193100, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 989900, "presentismo": 193100, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 999800, "presentismo": 193100, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 1010300, "presentismo": 193100, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 1020600, "presentismo": 193100, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 1035200, "presentismo": 193100, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1128000, "presentismo": 210700, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1150500, "presentismo": 210700, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1172100, "presentismo": 210700, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1191000, "presentismo": 210700, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1210200, "presentismo": 210700, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1232300, "presentismo": 210700, "viaticos": 545000, "suma_no_rem": 120000},
            },
            "Controlador de Admisión y Permanencia General": {
                "2026-01": {"basico": 867200, "presentismo": 165000, "viaticos": 473800, "suma_no_rem": 10000},
                "2026-02": {"basico": 876000, "presentismo": 165000, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-03": {"basico": 884800, "presentismo": 165000, "viaticos": 473800, "suma_no_rem": 25000},
                "2026-04": {"basico": 893650, "presentismo": 165000, "viaticos": 480500, "suma_no_rem": 25000},
                "2026-05": {"basico": 902600, "presentismo": 165000, "viaticos": 487000, "suma_no_rem": 30000},
                "2026-06": {"basico": 911650, "presentismo": 165000, "viaticos": 498000, "suma_no_rem": 70000},
                "2026-07": {"basico": 1001300, "presentismo": 180000, "viaticos": 505500, "suma_no_rem": 20000},
                "2026-08": {"basico": 1020300, "presentismo": 180000, "viaticos": 514500, "suma_no_rem": 30000},
                "2026-09": {"basico": 1037600, "presentismo": 180000, "viaticos": 524000, "suma_no_rem": 50000},
                "2026-10": {"basico": 1053200, "presentismo": 180000, "viaticos": 534000, "suma_no_rem": 60000},
                "2026-11": {"basico": 1069000, "presentismo": 180000, "viaticos": 545000, "suma_no_rem": 70000},
                "2026-12": {"basico": 1085000, "presentismo": 180000, "viaticos": 545000, "suma_no_rem": 120000},
            },
        }

    def get_scale(self, category: str, year: int, month: int) -> dict:
        key = f"{year}-{month:02d}"
        cat_scales = self.escalas.get(category, self.escalas["Vigilador General"])
        return cat_scales.get(key, cat_scales["2026-06"])

    def get_base_hours(self, year: int, month: int) -> int:
        _, days = calendar.monthrange(year, month)
        if days == 31:
            return 216
        elif days == 30:
            return 208
        return 192

    def project_ideal_month(self, year: int, month: int) -> dict:
        _, days = calendar.monthrange(year, month)
        total_hours = 0
        holidays_count = 0

        for day in range(1, days + 1):
            d = date(year, month, day)
            is_holiday = d in self.feriados_arg
            is_weekday = d.weekday() < 5

            if is_weekday:
                if is_holiday:
                    total_hours += 8
                    holidays_count += 1
                else:
                    total_hours += 11

        return {"horas_teoricas": total_hours, "feriados_habiles": holidays_count}

    def calculate_seniority(self, admission_date: str, year: int, month: int) -> int:
        try:
            adm = datetime.strptime(admission_date, "%Y-%m-%d").date()
        except ValueError:
            adm = datetime.strptime(admission_date, "%d/%m/%Y").date()
        liq_date = date(year, month, 1)
        years = liq_date.year - adm.year
        if (liq_date.month, liq_date.day) < (adm.month, adm.day):
            years -= 1
        return max(0, years)

    def calculate_sac(self, category: str, year: int, month: int, admission_date: str) -> dict:
        semester = 1 if month == 6 else 2
        months_range = range(1, 7) if semester == 1 else range(7, 13)
        max_remunerative = 0.0

        for m in months_range:
            key = f"{year}-{m:02d}"
            cat_scales = self.escalas.get(category, self.escalas["Vigilador General"])
            scale = cat_scales.get(key)
            if not scale:
                continue

            base_m = self.get_base_hours(year, m)
            projection = self.project_ideal_month(year, m)
            seniority_years = self.calculate_seniority(admission_date, year, m)
            seniority_pay = scale["basico"] * 0.01 * seniority_years

            hourly = (scale["basico"] + scale["presentismo"] + seniority_pay) / 200
            holiday_value = scale["basico"] / 25

            overtime = max(0, (projection["horas_teoricas"] - base_m)) * hourly * 1.5
            holidays_pay = projection["feriados_habiles"] * holiday_value

            remunerative = (
                scale["basico"]
                + scale["presentismo"]
                + seniority_pay
                + overtime
                + holidays_pay
            )
            if remunerative > max_remunerative:
                max_remunerative = remunerative

        sac_bruto = max_remunerative * 0.5
        sac_desc = sac_bruto * 0.17
        return {"sac_bruto": sac_bruto, "sac_descuentos": sac_desc, "sac_neto": sac_bruto - sac_desc}

    def calculate(
        self,
        category: str,
        year: int,
        month: int,
        admission_date: str,
        total_hours: float,
        dias_vacaciones: int = 0,
    ) -> dict:
        _, days_in_month = calendar.monthrange(year, month)
        base_required = self.get_base_hours(year, month)
        projection = self.project_ideal_month(year, month)
        scale = self.get_scale(category, year, month)

        seniority_years = self.calculate_seniority(admission_date, year, month)
        seniority_amount = scale["basico"] * 0.01 * seniority_years

        if dias_vacaciones > 0:
            days_worked = days_in_month - dias_vacaciones
            basic_worked = (scale["basico"] / 30) * days_worked
            vacation_pay = (scale["basico"] / 25) * dias_vacaciones
            total_basic = basic_worked + vacation_pay
        else:
            days_worked = days_in_month
            basic_worked = scale["basico"]
            vacation_pay = 0.0
            total_basic = scale["basico"]

        overtime_hours = max(0.0, total_hours - base_required)
        has_presentismo = total_hours >= base_required or dias_vacaciones > 0

        hourly_normal = (scale["basico"] + scale["presentismo"] + seniority_amount) / 200
        hourly_overtime = hourly_normal * 1.5
        holiday_value = scale["basico"] / 25

        overtime_amount = overtime_hours * hourly_overtime
        holidays_amount = projection["feriados_habiles"] * holiday_value
        presentismo_amount = scale["presentismo"] if has_presentismo else 0.0

        remunerative = total_basic + presentismo_amount + overtime_amount + holidays_amount + seniority_amount
        non_remunerative = scale["viaticos"] + scale["suma_no_rem"]

        deductions = remunerative * 0.17 + self.os_fija
        net = (remunerative + non_remunerative) - deductions

        sac = {"sac_bruto": 0.0, "sac_descuentos": 0.0, "sac_neto": 0.0}
        if month in (6, 12):
            sac = self.calculate_sac(category, year, month, admission_date)

        return {
            "basic_salary": scale["basico"],
            "seniority_years": seniority_years,
            "seniority_amount": seniority_amount,
            "presentismo": presentismo_amount,
            "overtime_hours": overtime_hours,
            "overtime_amount": overtime_amount,
            "holiday_hours": float(projection["feriados_habiles"]),
            "holiday_amount": holidays_amount,
            "night_hours": 0.0,
            "night_amount": 0.0,
            "viaticos": scale["viaticos"],
            "non_remunerative": scale["suma_no_rem"],
            "gross_salary": remunerative,
            "deductions": deductions,
            "net_salary": net,
            "sac_bruto": sac["sac_bruto"],
            "sac_deducciones": sac["sac_descuentos"],
            "sac_neto": sac["sac_neto"],
        }
