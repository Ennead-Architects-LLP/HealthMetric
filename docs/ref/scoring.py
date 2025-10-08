"""
HealthMetric Scoring System
Calculates model health scores and writes them back to SexyDuck data files

Simple usage:
    from scoring import score_file
    score_file('path/to/model.sexyDuck')
"""

import json
from typing import Dict, Any


# =============================================================================
# SCORING CONFIGURATION - Modify these values to adjust scoring
# =============================================================================

SCORING_METRICS = {
    # Format: 'Metric Name': {'weight': points, 'min': best_value, 'max': worst_value}
    
    'File size':             {'weight': 12, 'min': 0,    'max': 500},    # MB (estimated)
    'High Warnings':         {'weight': 12, 'min': 0,    'max': 30},     # Critical warnings
    'Purgeable Families':    {'weight': 12, 'min': 0,    'max': 250},    # Unused families
    'Medium Warnings':       {'weight': 8,  'min': 0,    'max': 50},     # Regular warnings
    'In-Place Families':     {'weight': 8,  'min': 0,    'max': 20},     # In-place families
    'Views not on Sheets':   {'weight': 8,  'min': 0,    'max': 200},    # Unplaced views
    'Model Groups':          {'weight': 6,  'min': 0,    'max': 100},    # Overused groups
    'Detail Groups':         {'weight': 6,  'min': 0,    'max': 100},    # Overused groups
    'CAD Imports':           {'weight': 4,  'min': 0,    'max': 5},      # CAD files
    'Unplaced Rooms':        {'weight': 4,  'min': 0,    'max': 10},     # Rooms not placed
    'Unused View Templates': {'weight': 4,  'min': 0,    'max': 5},      # Unused templates
    'Filled Regions':        {'weight': 4,  'min': 0,    'max': 5000},   # Filled regions
    'Lines':                 {'weight': 4,  'min': 0,    'max': 5000},   # Detail lines
    'Unpinned Grids':        {'weight': 4,  'min': 0,    'max': 6},      # Unpinned grids
    'Unpinned Levels':       {'weight': 4,  'min': 0,    'max': 4},      # Unpinned levels
}

GRADE_THRESHOLDS = {
    'A': 90,
    'B': 80,
    'C': 70,
    'D': 60,
    'F': 0
}


# =============================================================================
# METRIC EXTRACTION - Extract values from SexyDuck data
# =============================================================================

def extract_metrics(sexy_duck_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract scoring metrics from SexyDuck data file.
    
    Args:
        sexy_duck_data: Parsed JSON from .sexyDuck file
        
    Returns:
        Dictionary with metric names and their actual values
    """
    result_data = sexy_duck_data.get('result_data', {})
    
    metrics = {}
    
    # File size (estimated from element count)
    total_elements = result_data.get('total_elements', 0)
    metrics['File size'] = total_elements * 0.0001  # Rough MB estimate
    
    # Warnings
    warnings = result_data.get('warnings', {})
    critical_warnings = warnings.get('critical_warning_count', 0)
    total_warnings = warnings.get('warning_count', 0)
    
    metrics['High Warnings'] = critical_warnings
    metrics['Medium Warnings'] = max(0, total_warnings - critical_warnings)
    
    # Purgeable elements
    metrics['Purgeable Families'] = result_data.get('purgeable_elements', 0)
    
    # Families
    families = result_data.get('families', {})
    metrics['In-Place Families'] = families.get('in_place_families', 0)
    
    # Views and Sheets
    views_sheets = result_data.get('views_sheets', {})
    metrics['Views not on Sheets'] = views_sheets.get('views_not_on_sheets', 0)
    
    # Groups (overused)
    model_groups = result_data.get('model_group_usage_analysis', {})
    metrics['Model Groups'] = model_groups.get('overused_count', 0)
    
    detail_groups = result_data.get('detail_group_usage_analysis', {})
    metrics['Detail Groups'] = detail_groups.get('overused_count', 0)
    
    # CAD Imports
    linked_files = result_data.get('linked_files', [])
    cad_count = sum(1 for f in linked_files 
                    if isinstance(f, dict) and 
                    f.get('type', '').lower() in ['dwg', 'dxf', 'cad'])
    metrics['CAD Imports'] = cad_count
    
    # Templates
    templates = result_data.get('templates_filters', {})
    metrics['Unused View Templates'] = templates.get('unused_view_templates', 0)
    
    # Metrics not currently available in data - default to 0
    metrics['Unplaced Rooms'] = 0
    metrics['Filled Regions'] = 0
    metrics['Lines'] = 0
    metrics['Unpinned Grids'] = 0
    metrics['Unpinned Levels'] = 0
    
    return metrics


# =============================================================================
# SCORING LOGIC - Calculate scores
# =============================================================================

def calculate_metric_score(actual_value: float, min_value: float, 
                          max_value: float, weight: float) -> float:
    """
    Calculate score for a single metric.
    
    Formula: score = weight * percentage_within_range
    - If actual <= min: full points (100%)
    - If actual >= max: zero points (0%)
    - Between min and max: linear interpolation
    
    Args:
        actual_value: Actual value from the model
        min_value: Minimum (best) acceptable value
        max_value: Maximum (worst) acceptable value
        weight: Point weight for this metric
        
    Returns:
        Score contribution (0 to weight)
    """
    if max_value == min_value:
        # If min equals max, give full points if actual is at or below that value
        return weight if actual_value <= min_value else 0
    
    # Calculate percentage within acceptable range
    # Lower is better, so we reverse the calculation
    percentage = max(0, min(1, (max_value - actual_value) / (max_value - min_value)))
    
    return weight * percentage


def get_letter_grade(score: float) -> str:
    """
    Convert numerical score to letter grade.
    
    Args:
        score: Numerical score (0-100)
        
    Returns:
        Letter grade (A, B, C, D, or F)
    """
    for grade, threshold in GRADE_THRESHOLDS.items():
        if score >= threshold:
            return grade
    return 'F'


def calculate_score(sexy_duck_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate score for a model based on SexyDuck data.
    
    Args:
        sexy_duck_data: Parsed JSON from .sexyDuck file
        
    Returns:
        Dictionary containing:
            - total_score: Overall score (0-100)
            - grade: Letter grade (A-F)
            - metrics: List of individual metric scores
    """
    # Extract actual values from data
    actual_metrics = extract_metrics(sexy_duck_data)
    
    # Calculate score for each metric
    metric_details = []
    total_score = 0.0
    
    for metric_name, config in SCORING_METRICS.items():
        actual_value = actual_metrics.get(metric_name, 0)
        
        # Calculate score contribution
        contribution = calculate_metric_score(
            actual_value,
            config['min'],
            config['max'],
            config['weight']
        )
        
        total_score += contribution
        
        # Determine individual metric grade
        metric_percentage = (contribution / config['weight'] * 100) if config['weight'] > 0 else 0
        metric_grade = get_letter_grade(metric_percentage)
        
        metric_details.append({
            'metric': metric_name,
            'weight': config['weight'],
            'min': config['min'],
            'max': config['max'],
            'actual': actual_value,
            'contribution': round(contribution, 2),
            'grade': metric_grade
        })
    
    # Get overall grade
    overall_grade = get_letter_grade(total_score)
    
    return {
        'total_score': round(total_score, 2),
        'grade': overall_grade,
        'metrics': metric_details
    }


# =============================================================================
# FILE OPERATIONS - Load, score, and save
# =============================================================================

def score_file(file_path: str) -> None:
    """
    Load a SexyDuck file, calculate score, and write it back with 'score' key.
    
    Args:
        file_path: Path to .sexyDuck file
    """
    # Load the data
    with open(file_path, 'r', encoding='utf-8') as f:
        sexy_duck_data = json.load(f)
    
    # Calculate score
    score_data = calculate_score(sexy_duck_data)
    
    # Add score to the data
    sexy_duck_data['score'] = score_data
    
    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(sexy_duck_data, f, indent=4)
