# ticketGraph.py
import sys
# import os
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import re

BASE = Path(__file__).parent

def load_metric_csv(pathlike: str) -> pd.DataFrame:
    path = BASE / pathlike
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    df = pd.read_csv(path)
    if "Run" not in df.columns:
        raise ValueError(f"'Run' column not found in {path.name}")

    df["Run"] = df["Run"].astype(str).str.strip()
    if df["Run"].duplicated().any():
        dup_n = df["Run"].duplicated().sum()
        print(f"[INFO] {path.name}: dropped {dup_n} duplicate Run rows (kept last).")
        df = df.drop_duplicates(subset="Run", keep="last")

    tcols = [c for c in df.columns if str(c).startswith("t")]
    df = df[["Run"] + tcols].copy()

    for c in tcols:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    tnums = sorted((int(c[1:]), c) for c in tcols)
    t_sorted = [c for _, c in tnums]
    df = df.set_index("Run")[t_sorted]
    
    all_nan = df.columns[df.isna().all()]
    if len(all_nan):
        print(f"[WARN] {path.name}: dropped {len(all_nan)} all-NaN columns.")

    df = df.dropna(axis=1, how="all")
    
    # Drop row where Run index starts with "Step 10"
    df = df[~df.index.str.startswith("Step 10")]

    counts = df.notna().sum(axis=1).sort_values(ascending=True)
    print(f"\n[AUDIT] {path.name}: {len(df)} runs, {df.shape[1]} time points")
    if len(counts) > 0:
        head = counts.head(min(5, len(counts)))
        printable = ", ".join(f"{idx}: {cnt}" for idx, cnt in head.items())
        print(f"        fewest valid pts -> {printable}")

    return df

def group_exact_duplicates(df: pd.DataFrame):
    key_series = df.apply(lambda row: tuple(row.values), axis=1)
    groups = {}
    for run, key in zip(df.index, key_series):
        groups.setdefault(key, []).append(run)
    return [runs for runs in groups.values() if len(runs) > 1]

def plot_metric(ax, df: pd.DataFrame, title: str, ylabel: str):
    if df.empty:
        ax.set_title(f"{title} (no data)")
        ax.axis("off")
        return

    x = np.array([int(c[1:]) for c in df.columns])

    dup_groups = group_exact_duplicates(df)
    if dup_groups:
        short = [f"{g[0]}~{len(g)}" for g in dup_groups]
        print(f"[DUP] {title}: " + ", ".join(short))
    else:
        print(f"[DUP] {title}: none")

    dash_styles = [
        (None, None),
        (5, 3),
        (3, 3, 1, 3),
        (1, 2),
        (7, 3, 2, 3),
        (2, 2, 2, 2, 2, 4),
    ]

    dup_members = set(r for g in dup_groups for r in g)

    for run in df.index:
        if run in dup_members:
            continue
        y = df.loc[run].values
        ax.plot(x, y, label=run, linewidth=1.6, alpha=0.95)

    for g in dup_groups:
        for i, run in enumerate(g):
            y = df.loc[run].values
            ds = dash_styles[min(i, len(dash_styles) - 1)]
            line, = ax.plot(x, y, label=run, linewidth=1.8, alpha=0.95)
            if ds != (None, None):
                line.set_linestyle((0, ds))

    ax.set_title(title)
    ax.set_xlabel("Time Step")
    ax.set_ylabel(ylabel)
    
    # Add vertical dashed lines at x=125 and x=250
    ax.axvline(x=125, color='gray', linestyle='--', linewidth=1, alpha=0.7)
    ax.axvline(x=250, color='gray', linestyle='--', linewidth=1, alpha=0.7)

    handles, labels = ax.get_legend_handles_labels()
    clean_labels = []

    for lab in labels:
        lab = str(lab)

        # Case 1: label contains "Step X"
        m = re.search(r"Step\s*(\d+)", lab)
        if m:
            clean_labels.append(f"Cost {m.group(1)}")
            continue

        # Case 2: numeric run label like 50315 → step is first 1–2 digits
        m = re.match(r"(\d{1,2})", lab)
        if m:
            clean_labels.append(f"Cost {m.group(1)}")
            continue

        # Fallback (shouldn't really happen)
        clean_labels.append(lab)

    ax.legend(handles, clean_labels, fontsize="small", ncol=2)


# Get prefix from command line argument
if len(sys.argv) < 2:
    print("Usage: python ticketGraph.py <PREFIX>")
    print("Example: python ticketGraph.py LR2M15")
    sys.exit(1)

prefix = sys.argv[1]

pop_df      = load_metric_csv(f"dataLists/useful/{prefix}_P.csv")
gene_df     = load_metric_csv(f"dataLists/useful/{prefix}_G.csv")
social_df   = load_metric_csv(f"dataLists/useful/{prefix}_ST.csv")
learning_df = load_metric_csv(f"dataLists/useful/{prefix}_LT.csv")


plots = [
    (pop_df,      "Population over Time",       "Population"),
    (gene_df,     "Gene Bonus over Time",     "Gene Bonus"),
    (social_df,   "Social Learning Events over Time",   "Social Learning Event Count"),
    (learning_df, "Individual Learning Events over Time", "Individual Learning Event Count"),
]

fig, axes = plt.subplots(2, 2, figsize=(12, 8), sharex=True)
axes = axes.flatten()

for ax, (df, title, ylabel) in zip(axes, plots):
    plot_metric(ax, df, title, ylabel)

for ax in axes[len(plots):]:
    ax.axis("off")

plt.tight_layout()
plt.savefig(f"{prefix}.png", dpi=300)
plt.show()




# =======================================================================================================
#  OLD code

# import pandas as pd
# import matplotlib.pyplot as plt
# import os

# # ——— helper to load & clean up your “t0”, “t1”, … columns ———
# BASE = os.path.dirname(__file__)
# def load_and_fix(fname):
#     df = pd.read_csv(os.path.join(BASE, fname)).set_index("Run")
#     df.columns = df.columns.str.replace(r"^t", "", regex=True).astype(int)
#     return df

# # pop_df      = load_and_fix("Population.csv")
# # gene_df     = load_and_fix("GeneTickets.csv")
# # social_df   = load_and_fix("SocialTickets.csv")
# # learning_df = load_and_fix("LearningTickets.csv")

# # pop_df      = load_and_fix("PopulationLB.csv")
# # gene_df     = load_and_fix("GeneLB.csv")
# # social_df   = load_and_fix("SocialLB.csv")
# # learning_df = load_and_fix("LearningLB.csv")

# # pop_df      = load_and_fix("PopulationLB0.03M.csv")
# # gene_df     = load_and_fix("GeneLB0.03M.csv")
# # social_df   = load_and_fix("SocialLB0.03M.csv")
# # learning_df = load_and_fix("LearningLB0.03M.csv")


# # ==========================================================================
# # USEFUL GRAPHS
# # L01M_Graphs
# # pop_df      = load_and_fix("dataLists/useful/L01M_P.csv")
# # gene_df     = load_and_fix("dataLists/useful/L01M_G.csv")
# # social_df   = load_and_fix("dataLists/useful/L01M_ST.csv")
# # learning_df = load_and_fix("dataLists/useful/L01M_LT.csv")

# # L02M_Graphs
# # pop_df      = load_and_fix("dataLists/useful/L02M_P.csv")
# # gene_df     = load_and_fix("dataLists/useful/L02M_G.csv")
# # social_df   = load_and_fix("dataLists/useful/L02M_ST.csv")
# # learning_df = load_and_fix("dataLists/useful/L02M_LT.csv")

# # L03M_Graphs
# # pop_df      = load_and_fix("dataLists/useful/L03M_P.csv")
# # gene_df     = load_and_fix("dataLists/useful/L03M_G.csv")
# # social_df   = load_and_fix("dataLists/useful/L03M_ST.csv")
# # learning_df = load_and_fix("dataLists/useful/L03M_LT.csv")

# # L01M15_Graphs
# # pop_df      = load_and_fix("dataLists/useful/L01M15_P.csv")
# # gene_df     = load_and_fix("dataLists/useful/L01M15_G.csv")
# # social_df   = load_and_fix("dataLists/useful/L01M15_ST.csv")
# # learning_df = load_and_fix("dataLists/useful/L01M15_LT.csv")

# # L02M15_Graphs
# # pop_df      = load_and_fix("dataLists/useful/L02M15_P.csv")
# # gene_df     = load_and_fix("dataLists/useful/L02M15_G.csv")
# # social_df   = load_and_fix("dataLists/useful/L02M15_ST.csv")
# # learning_df = load_and_fix("dataLists/useful/L02M15_LT.csv")

# # L03M15_Graphs
# pop_df      = load_and_fix("dataLists/useful/L03M15_P.csv")
# gene_df     = load_and_fix("dataLists/useful/L03M15_G.csv")
# social_df   = load_and_fix("dataLists/useful/L03M15_ST.csv")
# learning_df = load_and_fix("dataLists/useful/L03M15_LT.csv")

# # ——— pack them into a list so we can loop ———
# plots = [
#     (pop_df,      "Population over Time",      "Population"),
#     (gene_df,     "Gene Tickets over Time",     "Gene Ticket Count"),
#     (social_df,   "Social Tickets over Time",   "Social Ticket Count"),
#     (learning_df, "Learning Tickets over Time", "Learning Ticket Count"),
# ]

# # ——— choose your grid size here ———
# # for exactly four plots a 2×2 grid is the cleanest:
# nrows, ncols = 2, 2
# fig, axes = plt.subplots(nrows, ncols, figsize=(12, 8), sharex=True)
# axes = axes.flatten()

# # ——— loop & draw each metric on its own axis ———
# for ax, (df, title, ylabel) in zip(axes, plots):
#     for run in df.index:
#         ax.plot(df.columns, df.loc[run], label=run)
#     ax.set_title(title)
#     ax.set_xlabel("Time Step")
#     ax.set_ylabel(ylabel)
#     ax.legend(fontsize="small", ncol=2)

# # ——— if you ever want a 4×4 grid, just flip these two lines: ———
# # nrows, ncols = 4, 4
# # fig, axes = plt.subplots(nrows, ncols, figsize=(16, 16), sharex=True)

# # ——— hide any unused subplots if your grid is bigger than `len(plots)` ———
# for ax in axes[len(plots):]:
#     ax.axis("off")

# plt.tight_layout()
# plt.show()

