function KpiCard({
  title,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="kpi-card">

      <div className="kpi-card-top">

        <div>
          <p className="kpi-title">
            {title}
          </p>

          <h2 className="kpi-value">
            {value}
          </h2>
        </div>

        <div className="kpi-icon">
          {Icon && <Icon size={24} />}
        </div>

      </div>

      {description && (
        <p className="kpi-description">
          {description}
        </p>
      )}

    </div>
  );
}

export default KpiCard;