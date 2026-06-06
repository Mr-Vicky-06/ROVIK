Push-Location "$PSScriptRoot\..\ml"
python -m rovik_ml.pipelines.generate_demo_dataset --rows 5000
python -m rovik_ml.pipelines.train_all
python -m rovik_ml.storage.budget
Pop-Location
